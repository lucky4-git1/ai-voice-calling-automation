import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentConfig, AgentStatus, VoiceEngineType } from '@callagent/shared';

@Injectable()
export class AgentsService {
  constructor(private prisma: PrismaService) {}

  async listAgents(orgId: string) {
    const agents = await this.prisma.agent.findMany({
      where: { organizationId: orgId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
        phoneNumbers: {
          select: { id: true, number: true, friendlyName: true },
        },
        _count: {
          select: { calls: true, campaigns: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return agents.map((a) => {
      const latestVer = a.versions[0];
      return {
        ...a,
        latestVersion: latestVer ? {
          ...latestVer,
          voiceConfig: JSON.parse(latestVer.voiceConfig || '{}'),
          tools: JSON.parse(latestVer.tools || '[]'),
          escalationRules: JSON.parse(latestVer.escalationRules || '{}'),
          businessHours: JSON.parse(latestVer.businessHours || '{}'),
        } : null,
      };
    });
  }

  async getAgent(orgId: string, agentId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, organizationId: orgId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
        phoneNumbers: true,
        calls: {
          orderBy: { startedAt: 'desc' },
          take: 5,
          include: { summary: true },
        },
      },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return {
      ...agent,
      versions: agent.versions.map((v) => ({
        ...v,
        voiceConfig: JSON.parse(v.voiceConfig || '{}'),
        tools: JSON.parse(v.tools || '[]'),
        escalationRules: JSON.parse(v.escalationRules || '{}'),
        businessHours: JSON.parse(v.businessHours || '{}'),
      })),
    };
  }

  async createAgent(orgId: string, userId: string, dto: AgentConfig) {
    return this.prisma.$transaction(async (tx) => {
      const agent = await tx.agent.create({
        data: {
          organizationId: orgId,
          name: dto.name,
          description: dto.description || '',
          businessPurpose: dto.businessPurpose,
          status: AgentStatus.DRAFT,
        },
      });

      const version = await tx.agentVersion.create({
        data: {
          agentId: agent.id,
          versionNumber: 1,
          systemPrompt: dto.systemPrompt,
          greetingMessage: dto.greetingMessage,
          fallbackMessage: dto.fallbackMessage || 'I apologize, could you please repeat that?',
          endOfCallMessage: dto.endOfCallMessage || 'Thank you for calling. Goodbye!',
          voiceConfig: JSON.stringify(dto.voiceConfig || {}),
          tools: JSON.stringify((dto.tools || []).map((t: any) => (typeof t === 'string' ? t : t.name))),
          escalationRules: JSON.stringify(dto.escalationRules || { allowHumanTransfer: true, transferPhoneNumber: '+15559990000' }),
          businessHours: JSON.stringify(dto.businessHours || { enabled: false, timezone: 'UTC' }),
          publishedByUserId: userId,
        },
      });

      await tx.agent.update({
        where: { id: agent.id },
        data: { currentVersionId: version.id },
      });

      return {
        ...agent,
        currentVersion: {
          ...version,
          voiceConfig: dto.voiceConfig || {},
          tools: dto.tools || [],
          escalationRules: dto.escalationRules || { allowHumanTransfer: true },
          businessHours: dto.businessHours || { enabled: false },
        },
      };
    });
  }

  async updateAgent(orgId: string, agentId: string, dto: Partial<AgentConfig>) {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, organizationId: orgId },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    const latest = agent.versions[0];
    const prevVoiceConfig = latest ? JSON.parse(latest.voiceConfig) : {};
    const prevEscalation = latest ? JSON.parse(latest.escalationRules) : {};
    const prevHours = latest ? JSON.parse(latest.businessHours) : {};

    return this.prisma.$transaction(async (tx) => {
      await tx.agent.update({
        where: { id: agentId },
        data: {
          name: dto.name || agent.name,
          description: dto.description ?? agent.description,
          businessPurpose: dto.businessPurpose || agent.businessPurpose,
          status: AgentStatus.DRAFT, // Edits mark it as draft until re-published
        },
      });

      const nextVersionNum = (latest?.versionNumber || 0) + 1;

      const newVersion = await tx.agentVersion.create({
        data: {
          agentId,
          versionNumber: nextVersionNum,
          systemPrompt: dto.systemPrompt || latest?.systemPrompt || '',
          greetingMessage: dto.greetingMessage || latest?.greetingMessage || '',
          fallbackMessage: dto.fallbackMessage || latest?.fallbackMessage || '',
          endOfCallMessage: dto.endOfCallMessage || latest?.endOfCallMessage || '',
          voiceConfig: JSON.stringify(dto.voiceConfig || prevVoiceConfig),
          tools: JSON.stringify(dto.tools ? dto.tools.map((t) => t.name) : JSON.parse(latest?.tools || '[]')),
          escalationRules: JSON.stringify(dto.escalationRules || prevEscalation),
          businessHours: JSON.stringify(dto.businessHours || prevHours),
        },
      });

      return tx.agent.update({
        where: { id: agentId },
        data: { currentVersionId: newVersion.id },
        include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
      });
    });
  }

  async validateAgent(orgId: string, agentId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, organizationId: orgId },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    });

    if (!agent || !agent.versions[0]) {
      throw new NotFoundException('Agent or version not found');
    }

    const v = agent.versions[0];
    const errors: string[] = [];

    if (!agent.name || agent.name.length < 2) errors.push('Agent name must be at least 2 characters');
    if (!v.systemPrompt || v.systemPrompt.length < 20) errors.push('System prompt must be at least 20 characters');
    if (!v.greetingMessage || v.greetingMessage.length < 2) errors.push('Initial greeting message is required');
    if (!v.fallbackMessage) errors.push('Fallback clarification message is required');

    const voice = JSON.parse(v.voiceConfig || '{}');
    if (!voice.ttsVoiceId) errors.push('TTS Voice ID must be selected');

    return {
      isValid: errors.length === 0,
      errors,
      validatedVersionId: v.id,
      versionNumber: v.versionNumber,
    };
  }

  async publishAgent(orgId: string, agentId: string, userId: string) {
    const validation = await this.validateAgent(orgId, agentId);
    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Agent configuration failed validation',
        errors: validation.errors,
      });
    }

    return this.prisma.agent.update({
      where: { id: agentId },
      data: {
        status: AgentStatus.PUBLISHED,
        updatedAt: new Date(),
      },
    });
  }

  async duplicateAgent(orgId: string, agentId: string, userId: string) {
    const source = await this.getAgent(orgId, agentId);
    const latest = source.versions[0];

    return this.prisma.$transaction(async (tx) => {
      const copy = await tx.agent.create({
        data: {
          organizationId: orgId,
          name: `${source.name} (Copy)`,
          description: source.description,
          businessPurpose: source.businessPurpose,
          status: AgentStatus.DRAFT,
        },
      });

      const copyVersion = await tx.agentVersion.create({
        data: {
          agentId: copy.id,
          versionNumber: 1,
          systemPrompt: latest.systemPrompt,
          greetingMessage: latest.greetingMessage,
          fallbackMessage: latest.fallbackMessage,
          endOfCallMessage: latest.endOfCallMessage,
          voiceConfig: JSON.stringify(latest.voiceConfig),
          tools: JSON.stringify(latest.tools),
          escalationRules: JSON.stringify(latest.escalationRules),
          businessHours: JSON.stringify(latest.businessHours),
          publishedByUserId: userId,
        },
      });

      return tx.agent.update({
        where: { id: copy.id },
        data: { currentVersionId: copyVersion.id },
      });
    });
  }

  async archiveAgent(orgId: string, agentId: string) {
    return this.prisma.agent.updateMany({
      where: { id: agentId, organizationId: orgId },
      data: { status: AgentStatus.ARCHIVED },
    });
  }

  // Realistic conversational playground simulator turn
  async simulateTurn(orgId: string, agentId: string, history: Array<{ role: string; content: string }>, message: string) {
    const agent = await this.getAgent(orgId, agentId);
    const ver = agent.versions[0];

    const lower = message.toLowerCase();
    let reply = '';
    let toolExecution: any = null;

    // Check for escalation
    const escalation = ver.escalationRules || {};
    const phrases = escalation.escalationTriggerPhrases || [];
    const shouldEscalate = phrases.some((p: string) => lower.includes(p.toLowerCase()));

    if (shouldEscalate && escalation.allowHumanTransfer) {
      reply = `I understand this requires personalized assistance. I am transferring you now to our human care team at ${escalation.transferPhoneNumber || 'extension 100'}. Please hold one moment.`;
    } else if (lower.includes('schedule') || lower.includes('appointment') || lower.includes('book') || lower.includes('meet') || lower.includes('friday')) {
      toolExecution = {
        toolName: 'check_calendar_availability',
        input: { date: '2026-10-30', requestedSlot: 'afternoon' },
        output: { availableSlots: ['14:00', '15:30', '16:00'], timezone: 'Eastern Time' },
      };
      reply = `I checked our calendar for Friday. We have slots open at 2:00 PM, 3:30 PM, and 4:00 PM Eastern. Which time fits your schedule best?`;
    } else if (lower.includes('order') || lower.includes('track') || lower.includes('ord-')) {
      const match = message.match(/ORD-[\w\d]+/i);
      const orderId = match ? match[0].toUpperCase() : 'ORD-99214';
      toolExecution = {
        toolName: 'lookup_order_status',
        input: { orderId },
        output: { status: 'IN_TRANSIT', carrier: 'FedEx Priority', eta: 'Tomorrow 16:30' },
      };
      reply = `I found order ${orderId} in our dispatch database. It is currently in transit via FedEx Priority with estimated arrival tomorrow by 4:30 PM. Would you like me to send tracking alerts to your phone?`;
    } else if (lower.includes('thank') || lower.includes('bye') || lower.includes('goodbye')) {
      reply = ver.endOfCallMessage || 'Thank you for calling Apex Global. Have a wonderful day!';
    } else if (history.length === 0) {
      reply = ver.greetingMessage || 'Hello, how may I assist you today?';
    } else {
      reply = `I understand you are asking about "${message.substring(0, 50)}...". Based on our policy, I can assist with scheduling, order updates, and customer support. How would you like to proceed?`;
    }

    return {
      agentId,
      versionNumber: ver.versionNumber,
      reply,
      toolExecution,
      latencyMs: Math.floor(180 + Math.random() * 140),
      metrics: {
        tokensEstimated: 85,
        turnConfidence: 0.96,
      },
    };
  }
}
