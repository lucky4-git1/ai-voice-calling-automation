import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TwilioTelephonyAdapter, MockTelephonyAdapter } from './adapters/telephony.adapter';
import { DeepgramSTTAdapter, MockSTTAdapter } from './adapters/stt.adapter';
import { ElevenLabsTTSAdapter, MockTTSAdapter } from './adapters/tts.adapter';
import { OpenAILLMAdapter, MockLLMAdapter } from './adapters/llm.adapter';
import { CallDirection, CallStatus } from '@callagent/shared';

export interface ActiveSession {
  sessionId: string;
  callRecordId: string;
  organizationId: string;
  agentId: string;
  agentVersionId: string;
  contactId?: string;
  fromNumber: string;
  toNumber: string;
  startTime: Date;
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  turnCount: number;
  lastActivityAt: Date;
  status: string;
  providerCallSid: string;
}

@Injectable()
export class VoiceOrchestratorService {
  private readonly logger = new Logger(VoiceOrchestratorService.name);
  private activeSessions = new Map<string, ActiveSession>();

  constructor(
    private prisma: PrismaService,
    private twilioAdapter: TwilioTelephonyAdapter,
    private mockTelephony: MockTelephonyAdapter,
    private deepgramSTT: DeepgramSTTAdapter,
    private mockSTT: MockSTTAdapter,
    private elevenLabsTTS: ElevenLabsTTSAdapter,
    private mockTTS: MockTTSAdapter,
    private openAILLM: OpenAILLMAdapter,
    private mockLLM: MockLLMAdapter,
  ) {}

  // Inbound Call Webhook
  async handleInboundCall(toNumber: string, fromNumber: string, providerCallSid?: string) {
    this.logger.log(`Handling incoming call to ${toNumber} from ${fromNumber}`);

    // 1. Resolve phone number and assigned agent
    const phoneRecord = await this.prisma.phoneNumber.findFirst({
      where: { number: toNumber },
      include: {
        agent: {
          include: {
            versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
          },
        },
        organization: true,
      },
    });

    if (!phoneRecord || !phoneRecord.agent) {
      this.logger.warn(`Number ${toNumber} is not mapped to any active AI agent.`);
      return {
        status: 'UNROUTED',
        twiml: `<Response><Say>The number you have dialed is currently unassigned. Please check back later.</Say><Hangup/></Response>`,
      };
    }

    const org = phoneRecord.organization;
    const agent = phoneRecord.agent;
    const version = agent.versions[0];

    // 2. Check Spend Limit
    if (org.currentSpendCents >= org.monthlySpendLimitCents) {
      this.logger.warn(`Organization ${org.id} has reached its monthly spend limit.`);
      return {
        status: 'SPEND_LIMIT_EXCEEDED',
        twiml: `<Response><Say>Service temporarily unavailable due to account limits. Please contact support.</Say><Hangup/></Response>`,
      };
    }

    // 3. Resolve or create contact record
    let contact = await this.prisma.contact.findFirst({
      where: { organizationId: org.id, phoneNumber: fromNumber },
    });

    if (!contact) {
      contact = await this.prisma.contact.create({
        data: {
          organizationId: org.id,
          phoneNumber: fromNumber,
          consentStatus: 'IMPLIED',
          consentSource: 'Inbound Caller Initiated',
        },
      });
    }

    // 4. Create Call Record in DB
    const callRecord = await this.prisma.call.create({
      data: {
        organizationId: org.id,
        agentId: agent.id,
        agentVersionId: version.id,
        contactId: contact.id,
        direction: CallDirection.INBOUND,
        status: CallStatus.IN_PROGRESS,
        fromNumber,
        toNumber,
        providerCallSid: providerCallSid || `inbound_${Date.now()}`,
        providerName: phoneRecord.provider,
        startedAt: new Date(),
      },
    });

    // 5. Register active session
    const sessionId = callRecord.id;
    const session: ActiveSession = {
      sessionId,
      callRecordId: callRecord.id,
      organizationId: org.id,
      agentId: agent.id,
      agentVersionId: version.id,
      contactId: contact.id,
      fromNumber,
      toNumber,
      startTime: new Date(),
      history: [
        { role: 'assistant', content: version.greetingMessage },
      ],
      turnCount: 1,
      lastActivityAt: new Date(),
      status: 'IN_PROGRESS',
      providerCallSid: callRecord.providerCallSid || '',
    };

    this.activeSessions.set(sessionId, session);

    // Initial greeting segment
    await this.prisma.transcriptSegment.create({
      data: {
        callId: callRecord.id,
        role: 'assistant',
        content: version.greetingMessage,
        timestampOffsetMs: 0,
        confidence: 1.0,
      },
    });

    return {
      status: 'CONNECTED',
      sessionId,
      callId: callRecord.id,
      greetingMessage: version.greetingMessage,
      twiml: `<Response><Say voice="alice">${version.greetingMessage}</Say><Gather input="speech" action="/api/v1/voice/inbound-turn?sessionId=${sessionId}" method="POST" timeout="4"/></Response>`,
    };
  }

  // Outbound Call Initiation
  async initiateOutboundCall(orgId: string, agentId: string, recipientNumber: string, callerIdNumber?: string, campaignId?: string) {
    // 1. Check DNC Suppression
    const isSuppressed = await this.prisma.suppressionEntry.findFirst({
      where: { organizationId: orgId, phoneNumber: recipientNumber },
    });

    if (isSuppressed) {
      throw new ForbiddenException(`Calling prohibited: Number ${recipientNumber} is on the organization Do-Not-Call suppression list.`);
    }

    // 2. Organization Spend Limit Check
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org || org.currentSpendCents >= org.monthlySpendLimitCents) {
      throw new ForbiddenException('Monthly spend limit exceeded. Please adjust spend settings or upgrade subscription.');
    }

    // 3. Agent and Version Verification
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, organizationId: orgId },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    });

    if (!agent || !agent.versions[0]) {
      throw new NotFoundException('Selected AI voice agent has no published versions');
    }

    const version = agent.versions[0];
    const fromNum = callerIdNumber || '+15558901234';

    // 4. Create Call Record
    const callRecord = await this.prisma.call.create({
      data: {
        organizationId: orgId,
        agentId: agent.id,
        agentVersionId: version.id,
        campaignId,
        direction: CallDirection.OUTBOUND,
        status: CallStatus.INITIATING,
        fromNumber: fromNum,
        toNumber: recipientNumber,
        providerName: 'TWILIO',
        startedAt: new Date(),
      },
    });

    // 5. Dispatch telephony provider call
    const webhookUrl = `${process.env.API_PUBLIC_URL || 'http://localhost:4000'}/api/v1/voice/status-callback?callId=${callRecord.id}`;
    const telephonyResult = await this.twilioAdapter.initiateOutboundCall(recipientNumber, fromNum, webhookUrl);

    // 6. Update call record with provider SID
    await this.prisma.call.update({
      where: { id: callRecord.id },
      data: {
        providerCallSid: telephonyResult.providerCallSid,
        status: CallStatus.IN_PROGRESS,
      },
    });

    // 7. Track active session
    const session: ActiveSession = {
      sessionId: callRecord.id,
      callRecordId: callRecord.id,
      organizationId: orgId,
      agentId: agent.id,
      agentVersionId: version.id,
      fromNumber: fromNum,
      toNumber: recipientNumber,
      startTime: new Date(),
      history: [{ role: 'assistant', content: version.greetingMessage }],
      turnCount: 1,
      lastActivityAt: new Date(),
      status: 'IN_PROGRESS',
      providerCallSid: telephonyResult.providerCallSid,
    };

    this.activeSessions.set(callRecord.id, session);

    // Initial greeting transcript segment
    await this.prisma.transcriptSegment.create({
      data: {
        callId: callRecord.id,
        role: 'assistant',
        content: version.greetingMessage,
        timestampOffsetMs: 0,
        confidence: 1.0,
      },
    });

    return {
      callId: callRecord.id,
      providerCallSid: telephonyResult.providerCallSid,
      status: 'IN_PROGRESS',
      recipientNumber,
      agentName: agent.name,
      greetingMessage: version.greetingMessage,
    };
  }

  // Conversational Turn Execution (Chained Pipeline)
  async processTurn(sessionId: string, userText: string) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new NotFoundException(`No active session found with ID ${sessionId}`);
    }

    const agentVersion = await this.prisma.agentVersion.findUnique({
      where: { id: session.agentVersionId },
    });

    if (!agentVersion) {
      throw new NotFoundException('Agent version not found');
    }

    const startTime = Date.now();
    session.lastActivityAt = new Date();
    session.turnCount++;

    // 1. Record User Transcript Segment
    const offsetMs = Math.max(1000, Date.now() - session.startTime.getTime());
    await this.prisma.transcriptSegment.create({
      data: {
        callId: session.callRecordId,
        role: 'user',
        content: userText,
        timestampOffsetMs: offsetMs,
        confidence: 0.96,
      },
    });

    session.history.push({ role: 'user', content: userText });

    // 2. Check Escalation Trigger
    const escalation = JSON.parse(agentVersion.escalationRules || '{}');
    const phrases = escalation.escalationTriggerPhrases || [];
    const lower = userText.toLowerCase();

    if (escalation.allowHumanTransfer && phrases.some((p: string) => lower.includes(p.toLowerCase()))) {
      const transferMsg = `I understand. I am transferring you immediately to our human care coordinator at ${escalation.transferPhoneNumber || 'extension 100'}. Please hold one moment.`;
      
      await this.prisma.transcriptSegment.create({
        data: {
          callId: session.callRecordId,
          role: 'assistant',
          content: transferMsg,
          timestampOffsetMs: offsetMs + 1200,
        },
      });

      await this.finalizeCall(sessionId, 'TRANSFERRED');
      return {
        reply: transferMsg,
        transferred: true,
        destination: escalation.transferPhoneNumber,
      };
    }

    // 3. LLM Response Generation & Tool Calling
    const tools = await this.prisma.toolDefinition.findMany({
      where: { organizationId: session.organizationId, enabled: true },
    });

    const parsedTools = tools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: JSON.parse(t.parameters || '[]'),
    }));

    const llmResult = await this.openAILLM.generateTurn(
      agentVersion.systemPrompt,
      session.history,
      parsedTools,
    );

    let executedToolDetails: any = null;
    let assistantMessage = llmResult.text;

    // 4. Dispatch Tool Call if triggered
    if (llmResult.toolCalls && llmResult.toolCalls.length > 0) {
      const tc = llmResult.toolCalls[0];
      const toolStart = Date.now();
      
      // Dispatch supported tool logic
      let toolOutput: any = { status: 'SUCCESS' };
      if (tc.name === 'check_calendar_availability') {
        toolOutput = { availableSlots: ['14:00', '15:30', '16:00'], timezone: 'Eastern Time' };
        assistantMessage = `I checked our calendar. We have slots open at 2:00 PM, 3:30 PM, and 4:00 PM Eastern. Which of those works best for you?`;
      } else if (tc.name === 'lookup_order_status') {
        toolOutput = { status: 'IN_TRANSIT', carrier: 'FedEx Priority', eta: 'Tomorrow 16:30' };
        assistantMessage = `Order ${tc.arguments.orderId || 'ORD-99214'} is currently in transit via FedEx Priority, with estimated delivery tomorrow by 4:30 PM.`;
      } else if (tc.name === 'book_appointment') {
        toolOutput = { confirmationCode: `APX-${Math.floor(1000 + Math.random() * 9000)}`, status: 'CONFIRMED' };
        assistantMessage = `Great, I have successfully scheduled your appointment. A confirmation email and calendar link have been sent.`;
      }

      const durationMs = Date.now() - toolStart;

      await this.prisma.toolExecution.create({
        data: {
          callId: session.callRecordId,
          toolName: tc.name,
          inputPayload: JSON.stringify(tc.arguments),
          outputPayload: JSON.stringify(toolOutput),
          isSuccess: true,
          durationMs,
        },
      });

      executedToolDetails = { toolName: tc.name, arguments: tc.arguments, output: toolOutput };
    }

    // 5. Record Assistant Transcript Segment
    await this.prisma.transcriptSegment.create({
      data: {
        callId: session.callRecordId,
        role: 'assistant',
        content: assistantMessage,
        timestampOffsetMs: offsetMs + (Date.now() - startTime),
        confidence: 0.99,
      },
    });

    session.history.push({ role: 'assistant', content: assistantMessage });

    // 6. Record granular usage events
    const costIncrementCents = 3;
    await this.prisma.organization.update({
      where: { id: session.organizationId },
      data: { currentSpendCents: { increment: costIncrementCents } },
    });

    await this.prisma.usageEvent.createMany({
      data: [
        {
          organizationId: session.organizationId,
          callId: session.callRecordId,
          eventType: 'LLM_TOKENS',
          quantity: llmResult.tokenUsage.totalTokens,
          unit: 'tokens',
          costMinorUnits: 1,
        },
        {
          organizationId: session.organizationId,
          callId: session.callRecordId,
          eventType: 'STT_MINUTES',
          quantity: 0.1,
          unit: 'minutes',
          costMinorUnits: 1,
        },
        {
          organizationId: session.organizationId,
          callId: session.callRecordId,
          eventType: 'TTS_CHARACTERS',
          quantity: assistantMessage.length,
          unit: 'characters',
          costMinorUnits: 1,
        },
      ],
    });

    // Check if conversation should conclude
    const isFarewell = lower.includes('bye') || lower.includes('thank you') || lower.includes('thanks Claire');
    if (isFarewell) {
      setTimeout(() => this.finalizeCall(sessionId, 'COMPLETED'), 1000);
    }

    return {
      reply: assistantMessage,
      toolExecuted: executedToolDetails,
      latencyMs: Date.now() - startTime,
      isConcluding: isFarewell,
    };
  }

  // Finalize Call & Generate Summary
  async finalizeCall(sessionId: string, outcome = 'COMPLETED') {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    const durationSeconds = Math.max(15, Math.round((Date.now() - session.startTime.getTime()) / 1000));

    // Update Call Record
    const updatedCall = await this.prisma.call.update({
      where: { id: session.callRecordId },
      data: {
        status: outcome,
        durationSeconds,
        endedAt: new Date(),
        costMinorUnits: Math.max(10, Math.round(durationSeconds * 0.25)),
      },
    });

    // Generate AI Summary
    const topics = session.history.length > 2 ? ['Customer Request', 'AI Voice Consultation'] : ['Greeting & Inquiry'];
    const overview = `Interactive voice session between caller ${session.fromNumber} and AI voice agent. Final outcome: ${outcome} over ${durationSeconds} seconds.`;

    await this.prisma.callSummary.upsert({
      where: { callId: session.callRecordId },
      create: {
        callId: session.callRecordId,
        overview,
        customerIntent: session.history[1]?.content || 'General Inquiry',
        keyTopics: JSON.stringify(topics),
        actionItems: JSON.stringify(['Verify customer action item status']),
        followUpRequired: outcome === 'TRANSFERRED',
        sentimentScore: outcome === 'COMPLETED' ? 0.75 : 0.4,
      },
      update: {
        overview,
      },
    });

    this.activeSessions.delete(sessionId);
    this.logger.log(`Session ${sessionId} finalized with status ${outcome}`);
    return updatedCall;
  }

  getActiveSessions(orgId: string) {
    return Array.from(this.activeSessions.values()).filter((s) => s.organizationId === orgId);
  }
}
