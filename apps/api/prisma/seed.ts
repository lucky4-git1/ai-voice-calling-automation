import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Clean existing records
  await prisma.usageEvent.deleteMany();
  await prisma.toolExecution.deleteMany();
  await prisma.callSummary.deleteMany();
  await prisma.transcriptSegment.deleteMany();
  await prisma.call.deleteMany();
  await prisma.campaignRecipient.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.suppressionEntry.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.phoneNumber.deleteMany();
  await prisma.agentVersion.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.toolDefinition.deleteMany();
  await prisma.workflowExecution.deleteMany();
  await prisma.workflowVersion.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.knowledgeChunk.deleteMany();
  await prisma.knowledgeDocument.deleteMany();
  await prisma.knowledgeBase.deleteMany();
  await prisma.integrationConnection.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.organizationMembership.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  console.log('✓ Cleaned existing database records');

  // 2. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Apex Global Technologies',
      slug: 'apex-global',
      plan: 'PROFESSIONAL',
      timezone: 'America/New_York',
      monthlySpendLimitCents: 50000,
      currentSpendCents: 14250,
      stripeCustomerId: 'cus_demo_apex987',
    },
  });

  // Second demo org for tenant isolation testing
  const secondOrg = await prisma.organization.create({
    data: {
      name: 'Riviera Health Partners',
      slug: 'riviera-health',
      plan: 'STARTER',
      timezone: 'America/Los_Angeles',
      monthlySpendLimitCents: 20000,
      currentSpendCents: 3200,
    },
  });

  // 3. Create Users
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const owner = await prisma.user.create({
    data: {
      email: 'alex.mercer@apexglobal.io',
      name: 'Alex Mercer',
      passwordHash,
      emailVerified: true,
      memberships: {
        create: {
          organizationId: org.id,
          role: 'OWNER',
        },
      },
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'sarah.chen@apexglobal.io',
      name: 'Sarah Chen',
      passwordHash,
      emailVerified: true,
      memberships: {
        create: {
          organizationId: org.id,
          role: 'ADMIN',
        },
      },
    },
  });

  const operator = await prisma.user.create({
    data: {
      email: 'marcus.vance@apexglobal.io',
      name: 'Marcus Vance',
      passwordHash,
      emailVerified: true,
      memberships: {
        create: {
          organizationId: org.id,
          role: 'OPERATOR',
        },
      },
    },
  });

  // User in second org for isolation testing
  await prisma.user.create({
    data: {
      email: 'dr.elena@rivierahealth.com',
      name: 'Dr. Elena Rostova',
      passwordHash,
      emailVerified: true,
      memberships: {
        create: {
          organizationId: secondOrg.id,
          role: 'OWNER',
        },
      },
    },
  });

  console.log('✓ Created users and organizations');

  // 4. Tools definitions
  const toolCheckCal = await prisma.toolDefinition.create({
    data: {
      organizationId: org.id,
      name: 'check_calendar_availability',
      description: 'Check available appointment slots for a given date and service type',
      parameters: JSON.stringify([
        { name: 'date', type: 'string', description: 'YYYY-MM-DD date to check', required: true },
        { name: 'serviceType', type: 'string', description: 'Consultation, demo, or review', required: false },
      ]),
      enabled: true,
      requiresConfirmation: false,
    },
  });

  const toolBookAppt = await prisma.toolDefinition.create({
    data: {
      organizationId: org.id,
      name: 'book_appointment',
      description: 'Confirm and book an appointment slot on the calendar',
      parameters: JSON.stringify([
        { name: 'customerName', type: 'string', description: 'Full name of customer', required: true },
        { name: 'customerPhone', type: 'string', description: 'Contact phone number', required: true },
        { name: 'datetime', type: 'string', description: 'ISO 8601 start time', required: true },
        { name: 'notes', type: 'string', description: 'Topic or reason for appointment', required: false },
      ]),
      enabled: true,
      requiresConfirmation: true,
    },
  });

  const toolLookupOrder = await prisma.toolDefinition.create({
    data: {
      organizationId: org.id,
      name: 'lookup_order_status',
      description: 'Look up real-time order status, shipping carrier, and estimated delivery by order ID',
      parameters: JSON.stringify([
        { name: 'orderId', type: 'string', description: 'Order ID e.g. ORD-98214', required: true },
      ]),
      enabled: true,
      requiresConfirmation: false,
    },
  });

  const toolTransferHuman = await prisma.toolDefinition.create({
    data: {
      organizationId: org.id,
      name: 'transfer_to_human_agent',
      description: 'Initiate warm or cold transfer to a live department specialist',
      parameters: JSON.stringify([
        { name: 'department', type: 'string', description: 'Support, billing, or sales', required: true },
        { name: 'reason', type: 'string', description: 'Reason for escalation', required: true },
      ]),
      enabled: true,
      requiresConfirmation: true,
    },
  });

  console.log('✓ Created tool definitions');

  // 5. Create AI Agents
  const receptionist = await prisma.agent.create({
    data: {
      organizationId: org.id,
      name: 'Claire - Front Desk & Booking Specialist',
      description: 'Professional AI concierge managing inbound queries, scheduling consultations, and routing calls',
      businessPurpose: 'Inbound reception, call triage, and automated calendar scheduling for Apex enterprise inquiries.',
      status: 'PUBLISHED',
    },
  });

  const receptionistVersion = await prisma.agentVersion.create({
    data: {
      agentId: receptionist.id,
      versionNumber: 1,
      systemPrompt: `You are Claire, the executive receptionist for Apex Global Technologies.
Your demeanor is warm, concise, professional, and composed.
Always greet the caller politely and ask how you can direct or assist them today.
When callers ask to schedule a consultation or meeting, use the 'check_calendar_availability' tool first. Once they choose a slot, confirm details and call 'book_appointment'.
If the caller asks for someone specific or seems upset, offer to transfer them to human support.
Never make up facts not present in your knowledge base. Keep voice answers under 2-3 sentences per turn for natural pacing.`,
      greetingMessage: 'Hello, thank you for calling Apex Global Technologies. My name is Claire. How may I direct your call today?',
      fallbackMessage: 'I apologize, the connection cut out for a moment. Could you please repeat that?',
      endOfCallMessage: 'Thank you for calling Apex Global. We look forward to speaking with you again. Goodbye!',
      voiceConfig: JSON.stringify({
        engineType: 'CHAINED_PIPELINE',
        sttProvider: 'DEEPGRAM',
        sttModel: 'nova-2',
        sttLanguage: 'en-US',
        llmProvider: 'OPENAI',
        llmModel: 'gpt-4o',
        temperature: 0.6,
        ttsProvider: 'ELEVENLABS',
        ttsVoiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel
        ttsSpeed: 1.0,
        interruptionSensitivity: 'HIGH',
        silenceTimeoutMs: 3200,
        maxCallDurationSeconds: 900,
        ambientSound: 'OFFICE',
      }),
      tools: JSON.stringify(['check_calendar_availability', 'book_appointment', 'transfer_to_human_agent']),
      escalationRules: JSON.stringify({
        allowHumanTransfer: true,
        transferPhoneNumber: '+15559990000',
        escalationTriggerPhrases: ['human', 'representative', 'operator', 'supervisor', 'agent'],
      }),
      businessHours: JSON.stringify({
        enabled: true,
        timezone: 'America/New_York',
        schedule: {
          monday: { start: '08:30', end: '17:30', closed: false },
          tuesday: { start: '08:30', end: '17:30', closed: false },
          wednesday: { start: '08:30', end: '17:30', closed: false },
          thursday: { start: '08:30', end: '17:30', closed: false },
          friday: { start: '08:30', end: '17:30', closed: false },
          saturday: { start: '09:00', end: '13:00', closed: false },
          sunday: { closed: true },
        },
      }),
      publishedByUserId: owner.id,
    },
  });

  await prisma.agent.update({
    where: { id: receptionist.id },
    data: { currentVersionId: receptionistVersion.id },
  });

  // Agent 2: Support & Order Specialist
  const supportAgent = await prisma.agent.create({
    data: {
      organizationId: org.id,
      name: 'David - Order & Returns Support',
      description: 'Handles tracking enquiries, return authorizations, and product FAQ resolution',
      businessPurpose: 'Immediate resolution of order tracking, warranty claims, and shipping inquiries without human queue wait.',
      status: 'PUBLISHED',
    },
  });

  const supportVersion = await prisma.agentVersion.create({
    data: {
      agentId: supportAgent.id,
      versionNumber: 1,
      systemPrompt: `You are David, senior customer support AI at Apex Global.
You help customers locate their order status, check shipping timelines, and handle returns.
Always ask for the order ID (format ORD-XXXXX) when checking order details.
Call 'lookup_order_status' to fetch real-time data.
If an order is damaged or delayed over 7 days, apologize sincerely and offer an escalated support ticket or human transfer.`,
      greetingMessage: 'Thank you for reaching Apex Customer Care. My name is David. Do you have an order number I can look up for you?',
      fallbackMessage: 'Pardon me, could you spell that order ID or repeat your question?',
      endOfCallMessage: 'Thank you for choosing Apex. Your confirmation details have been sent. Have a great day!',
      voiceConfig: JSON.stringify({
        engineType: 'CHAINED_PIPELINE',
        sttProvider: 'DEEPGRAM',
        sttModel: 'nova-2',
        sttLanguage: 'en-US',
        llmProvider: 'OPENAI',
        llmModel: 'gpt-4o-mini',
        temperature: 0.5,
        ttsProvider: 'ELEVENLABS',
        ttsVoiceId: 'AZnzlk1XvdvUeBnXmlld', // Domi
        ttsSpeed: 1.05,
        interruptionSensitivity: 'MEDIUM',
        silenceTimeoutMs: 3000,
        maxCallDurationSeconds: 600,
        ambientSound: 'NONE',
      }),
      tools: JSON.stringify(['lookup_order_status', 'transfer_to_human_agent']),
      escalationRules: JSON.stringify({
        allowHumanTransfer: true,
        transferPhoneNumber: '+15559990001',
        escalationTriggerPhrases: ['speak to manager', 'representative', 'complaint'],
      }),
      businessHours: JSON.stringify({ enabled: false, timezone: 'UTC' }),
      publishedByUserId: admin.id,
    },
  });

  await prisma.agent.update({
    where: { id: supportAgent.id },
    data: { currentVersionId: supportVersion.id },
  });

  // Agent 3: Outbound Sales Qualifier
  const salesAgent = await prisma.agent.create({
    data: {
      organizationId: org.id,
      name: 'Elena - Enterprise Outbound Qualifier',
      description: 'Respectful, compliant outreach to opt-in prospects for enterprise software demos',
      businessPurpose: 'Identify decision makers, gauge requirements, and schedule 15-minute product walkthroughs.',
      status: 'PUBLISHED',
    },
  });

  const salesVersion = await prisma.agentVersion.create({
    data: {
      agentId: salesAgent.id,
      versionNumber: 1,
      systemPrompt: `You are Elena calling on behalf of Apex Global Technologies regarding the caller's recent whitepaper download.
Verify whether you are speaking with the intended contact.
If the recipient indicates they are busy or not interested, politely thank them, offer to remove them from future calls, and disconnect immediately.
If they are interested, qualify their current voice automation needs and schedule a discovery session using 'book_appointment'.`,
      greetingMessage: 'Hi there, this is Elena with Apex Global following up on your team inquiry regarding voice automation. Did I catch you at an okay time?',
      fallbackMessage: 'Sorry, I missed that last phrase. Could you repeat it?',
      endOfCallMessage: 'Thanks so much for your time today. Have a productive week!',
      voiceConfig: JSON.stringify({
        engineType: 'CHAINED_PIPELINE',
        sttProvider: 'DEEPGRAM',
        sttModel: 'nova-2',
        sttLanguage: 'en-US',
        llmProvider: 'OPENAI',
        llmModel: 'gpt-4o',
        temperature: 0.65,
        ttsProvider: 'ELEVENLABS',
        ttsVoiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella
        ttsSpeed: 1.0,
        interruptionSensitivity: 'HIGH',
        silenceTimeoutMs: 3500,
        maxCallDurationSeconds: 480,
        ambientSound: 'NONE',
      }),
      tools: JSON.stringify(['check_calendar_availability', 'book_appointment']),
      escalationRules: JSON.stringify({ allowHumanTransfer: false }),
      businessHours: JSON.stringify({ enabled: true, timezone: 'America/New_York' }),
      publishedByUserId: owner.id,
    },
  });

  await prisma.agent.update({
    where: { id: salesAgent.id },
    data: { currentVersionId: salesVersion.id },
  });

  console.log('✓ Created 3 AI voice agents with versioned configurations');

  // 6. Phone Numbers
  const phone1 = await prisma.phoneNumber.create({
    data: {
      organizationId: org.id,
      number: '+15552348901',
      friendlyName: 'NYC Primary Inbound Line',
      provider: 'TWILIO',
      status: 'ACTIVE',
      activeAgentId: receptionist.id,
      capabilities: JSON.stringify({ voice: true, sms: false, sip: true }),
    },
  });

  const phone2 = await prisma.phoneNumber.create({
    data: {
      organizationId: org.id,
      number: '+15552348902',
      friendlyName: 'Customer Support Direct line',
      provider: 'TWILIO',
      status: 'ACTIVE',
      activeAgentId: supportAgent.id,
      capabilities: JSON.stringify({ voice: true, sms: false, sip: true }),
    },
  });

  const phone3 = await prisma.phoneNumber.create({
    data: {
      organizationId: org.id,
      number: '+15558901234',
      friendlyName: 'Outbound Caller ID - East Coast',
      provider: 'TELNYX',
      status: 'ACTIVE',
      capabilities: JSON.stringify({ voice: true, sms: true, sip: true }),
    },
  });

  console.log('✓ Created phone numbers');

  // 7. Contacts & Consent
  const contactsData = [
    {
      phoneNumber: '+14155550111',
      name: 'Jonathan Sterling',
      email: 'jsterling@summitcapital.com',
      company: 'Summit Capital Partners',
      timezone: 'America/Los_Angeles',
      consentStatus: 'EXPRESS',
      consentSource: 'Inbound Web Demo Request Form (2026-10-15)',
      tags: JSON.stringify(['enterprise', 'finance', 'high-priority']),
      customFields: JSON.stringify({ estimatedSeats: 120, currentProvider: 'Legacy IVR' }),
    },
    {
      phoneNumber: '+12125550144',
      name: 'Dr. Rebecca Vance',
      email: 'rvance@metropolitanclinic.org',
      company: 'Metropolitan Health Network',
      timezone: 'America/New_York',
      consentStatus: 'EXPRESS',
      consentSource: 'Executive Webinar Registration',
      tags: JSON.stringify(['healthcare', 'reception-automation']),
      customFields: JSON.stringify({ clinicLocations: 4, monthlyCallVolume: 8500 }),
    },
    {
      phoneNumber: '+13125550188',
      name: 'Michael Torres',
      email: 'mtorres@logisticsdirect.com',
      company: 'Logistics Direct Worldwide',
      timezone: 'America/Chicago',
      consentStatus: 'EXPRESS',
      consentSource: 'Product Trial Sign-up',
      tags: JSON.stringify(['logistics', 'order-tracking']),
      customFields: JSON.stringify({ ecommPlatform: 'Shopify Plus' }),
    },
    {
      phoneNumber: '+16175550199',
      name: 'Cassandra Wright',
      email: 'c.wright@cambridgedental.com',
      company: 'Cambridge Dental Associates',
      timezone: 'America/New_York',
      consentStatus: 'EXPRESS',
      consentSource: 'Referral Partner Intro',
      tags: JSON.stringify(['smb', 'dental-practice']),
      customFields: JSON.stringify({ activePractitioners: 6 }),
    },
    {
      phoneNumber: '+12065550123',
      name: 'David K. Lawson',
      email: 'dlawson@pacificretail.com',
      company: 'Pacific Retail Brands',
      timezone: 'America/Los_Angeles',
      consentStatus: 'REVOKED',
      consentSource: 'Web Form',
      isDncSuppressed: true,
      tags: JSON.stringify(['retail', 'opted-out']),
      customFields: JSON.stringify({}),
    },
  ];

  const createdContacts = [];
  for (const c of contactsData) {
    const contact = await prisma.contact.create({
      data: {
        organizationId: org.id,
        ...c,
      },
    });
    createdContacts.push(contact);
  }

  // DNC Suppression
  await prisma.suppressionEntry.create({
    data: {
      organizationId: org.id,
      phoneNumber: '+12065550123',
      reason: 'CUSTOMER_REVOCATION_REQUEST',
      source: 'IN_CALL_VERBAL_OPT_OUT',
    },
  });

  console.log('✓ Created contacts with explicit consent and DNC suppressions');

  // 8. Outbound Campaign
  const campaign = await prisma.campaign.create({
    data: {
      organizationId: org.id,
      name: 'Q4 Enterprise Discovery Outreach',
      description: 'Qualified outreach to technology directors who requested the 2026 Voice Automation Benchmark',
      agentId: salesAgent.id,
      callerIdNumber: phone3.number,
      status: 'RUNNING',
      concurrencyLimit: 4,
      maxRetries: 2,
      windowStart: '09:00',
      windowEnd: '17:30',
      timezoneEnforcement: 'RECIPIENT_LOCAL',
      budgetLimitCents: 25000,
      totalRecipients: createdContacts.length,
      successfulCalls: 3,
      failedCalls: 1,
      startedAt: new Date(Date.now() - 3600 * 4000),
    },
  });

  for (let i = 0; i < createdContacts.length; i++) {
    const contact = createdContacts[i];
    await prisma.campaignRecipient.create({
      data: {
        campaignId: campaign.id,
        contactId: contact.id,
        phoneNumber: contact.phoneNumber,
        status: contact.isDncSuppressed ? 'SUPPRESSED' : i === 0 ? 'COMPLETED' : 'PENDING',
        retryCount: 0,
        resultOutcome: contact.isDncSuppressed ? 'SUPPRESSED_BY_DNC_POLICY' : i === 0 ? 'APPOINTMENT_SCHEDULED' : null,
      },
    });
  }

  console.log('✓ Created campaign with recipients');

  // 9. Call Records & Transcripts
  const call1 = await prisma.call.create({
    data: {
      organizationId: org.id,
      agentId: receptionist.id,
      agentVersionId: receptionistVersion.id,
      contactId: createdContacts[0].id,
      direction: 'INBOUND',
      status: 'COMPLETED',
      fromNumber: createdContacts[0].phoneNumber,
      toNumber: phone1.number,
      durationSeconds: 142,
      startedAt: new Date(Date.now() - 1000 * 60 * 45),
      endedAt: new Date(Date.now() - 1000 * 60 * 45 + 142000),
      recordingUrl: 'https://storage.callagent-demo.internal/recordings/call_rec_09124a.wav',
      sentiment: 'POSITIVE',
      costMinorUnits: 48,
      providerCallSid: 'CA_twilio_live_0918237',
      providerName: 'TWILIO',
    },
  });

  // Transcript segments for Call 1
  const segmentsCall1 = [
    { role: 'assistant', offset: 0, text: 'Hello, thank you for calling Apex Global Technologies. My name is Claire. How may I direct your call today?' },
    { role: 'user', offset: 4200, text: 'Hi Claire, I am looking to schedule a consultation with your enterprise solutions team regarding voice calling for our branches.' },
    { role: 'assistant', offset: 11500, text: 'I would be delighted to help with that. May I check availability for this Thursday or Friday afternoon?' },
    { role: 'user', offset: 18200, text: 'Friday around 2:00 PM Eastern would work perfectly if you have that open.' },
    { role: 'assistant', offset: 23100, text: 'Checking our engineering calendar for Friday at 2:00 PM Eastern... Yes, that slot is available. May I confirm your name and email address?' },
    { role: 'user', offset: 31800, text: 'Jonathan Sterling, jsterling at summitcapital.com.' },
    { role: 'assistant', offset: 37400, text: 'Thank you Mr. Sterling. I have reserved Friday at 2:00 PM Eastern for your enterprise consultation. An invite and dial-in details have been sent to your email.' },
    { role: 'user', offset: 47900, text: 'That was very quick and smooth. Thank you Claire.' },
    { role: 'assistant', offset: 52100, text: 'My pleasure! Thank you for choosing Apex Global. Have a fantastic day.' },
  ];

  for (const s of segmentsCall1) {
    await prisma.transcriptSegment.create({
      data: {
        callId: call1.id,
        role: s.role,
        content: s.text,
        timestampOffsetMs: s.offset,
        confidence: 0.98,
      },
    });
  }

  // Summary for Call 1
  await prisma.callSummary.create({
    data: {
      callId: call1.id,
      overview: 'Caller inquired about enterprise voice automation for distributed branch locations and successfully booked a 45-minute discovery consultation.',
      customerIntent: 'Schedule enterprise sales consultation',
      keyTopics: JSON.stringify(['Enterprise Voice', 'Branch Automation', 'Appointment Booking']),
      actionItems: JSON.stringify(['Prepare enterprise branch deployment case study', 'Send calendar invite to Jonathan Sterling']),
      followUpRequired: true,
      sentimentScore: 0.88,
      extractedFields: JSON.stringify({
        customerName: 'Jonathan Sterling',
        email: 'jsterling@summitcapital.com',
        scheduledTime: 'Friday 2:00 PM EST',
        topic: 'Enterprise branch deployment',
      }),
    },
  });

  // Tool executions for Call 1
  await prisma.toolExecution.create({
    data: {
      callId: call1.id,
      toolName: 'check_calendar_availability',
      inputPayload: JSON.stringify({ date: '2026-10-30', serviceType: 'Enterprise Consultation' }),
      outputPayload: JSON.stringify({ availableSlots: ['14:00', '15:30', '16:00'], timezone: 'America/New_York' }),
      isSuccess: true,
      durationMs: 310,
    },
  });

  await prisma.toolExecution.create({
    data: {
      callId: call1.id,
      toolName: 'book_appointment',
      inputPayload: JSON.stringify({ customerName: 'Jonathan Sterling', datetime: '2026-10-30T14:00:00-04:00', email: 'jsterling@summitcapital.com' }),
      outputPayload: JSON.stringify({ confirmationCode: 'APEX-BKG-8831', status: 'CONFIRMED' }),
      isSuccess: true,
      durationMs: 420,
    },
  });

  // Usage events for Call 1
  await prisma.usageEvent.createMany({
    data: [
      { organizationId: org.id, callId: call1.id, eventType: 'TELEPHONY_SECONDS', quantity: 142, unit: 'seconds', costMinorUnits: 20 },
      { organizationId: org.id, callId: call1.id, eventType: 'STT_MINUTES', quantity: 2.4, unit: 'minutes', costMinorUnits: 12 },
      { organizationId: org.id, callId: call1.id, eventType: 'LLM_TOKENS', quantity: 1850, unit: 'tokens', costMinorUnits: 8 },
      { organizationId: org.id, callId: call1.id, eventType: 'TTS_CHARACTERS', quantity: 480, unit: 'characters', costMinorUnits: 8 },
    ],
  });

  // Call 2: Support Order Lookup
  const call2 = await prisma.call.create({
    data: {
      organizationId: org.id,
      agentId: supportAgent.id,
      agentVersionId: supportVersion.id,
      contactId: createdContacts[2].id,
      direction: 'INBOUND',
      status: 'COMPLETED',
      fromNumber: createdContacts[2].phoneNumber,
      toNumber: phone2.number,
      durationSeconds: 98,
      startedAt: new Date(Date.now() - 1000 * 60 * 120),
      endedAt: new Date(Date.now() - 1000 * 60 * 120 + 98000),
      recordingUrl: 'https://storage.callagent-demo.internal/recordings/call_rec_09124b.wav',
      sentiment: 'NEUTRAL',
      costMinorUnits: 32,
      providerCallSid: 'CA_twilio_live_0918238',
      providerName: 'TWILIO',
    },
  });

  await prisma.transcriptSegment.createMany({
    data: [
      { callId: call2.id, role: 'assistant', content: 'Thank you for reaching Apex Customer Care. My name is David. Do you have an order number I can look up for you?', timestampOffsetMs: 0, confidence: 0.99 },
      { callId: call2.id, role: 'user', content: 'Yes, it is ORD-99214. I want to check when it arrives.', timestampOffsetMs: 4100, confidence: 0.97 },
      { callId: call2.id, role: 'assistant', content: 'Let me pull up order ORD-99214 for you right now... It was dispatched yesterday via FedEx Priority with tracking number 7891-2309-8812. The estimated delivery date is tomorrow, Thursday by 4:30 PM.', timestampOffsetMs: 8900, confidence: 0.98 },
      { callId: call2.id, role: 'user', content: 'Awesome, that is all I needed. Appreciate it!', timestampOffsetMs: 19500, confidence: 0.99 },
      { callId: call2.id, role: 'assistant', content: 'You are very welcome! Have a wonderful day.', timestampOffsetMs: 23400, confidence: 0.99 },
    ],
  });

  await prisma.callSummary.create({
    data: {
      callId: call2.id,
      overview: 'Customer checked shipment progress of order ORD-99214. Inquired about delivery ETA and received real-time tracking carrier updates.',
      customerIntent: 'Track package shipment',
      keyTopics: JSON.stringify(['Order Tracking', 'FedEx Priority', 'Delivery Window']),
      actionItems: JSON.stringify([]),
      followUpRequired: false,
      sentimentScore: 0.72,
      extractedFields: JSON.stringify({ orderId: 'ORD-99214', carrier: 'FedEx Priority', eta: 'Thursday 4:30 PM' }),
    },
  });

  await prisma.toolExecution.create({
    data: {
      callId: call2.id,
      toolName: 'lookup_order_status',
      inputPayload: JSON.stringify({ orderId: 'ORD-99214' }),
      outputPayload: JSON.stringify({ status: 'IN_TRANSIT', carrier: 'FedEx Priority', trackingNumber: '789123098812', eta: 'Tomorrow 16:30' }),
      isSuccess: true,
      durationMs: 220,
    },
  });

  // Call 3: Human Escalation / Transfer
  const call3 = await prisma.call.create({
    data: {
      organizationId: org.id,
      agentId: receptionist.id,
      agentVersionId: receptionistVersion.id,
      contactId: createdContacts[1].id,
      direction: 'INBOUND',
      status: 'TRANSFERRED',
      fromNumber: createdContacts[1].phoneNumber,
      toNumber: phone1.number,
      durationSeconds: 65,
      startedAt: new Date(Date.now() - 1000 * 60 * 180),
      endedAt: new Date(Date.now() - 1000 * 60 * 180 + 65000),
      recordingUrl: 'https://storage.callagent-demo.internal/recordings/call_rec_09124c.wav',
      sentiment: 'NEUTRAL',
      costMinorUnits: 24,
      providerCallSid: 'CA_twilio_live_0918239',
      providerName: 'TWILIO',
    },
  });

  await prisma.callSummary.create({
    data: {
      callId: call3.id,
      overview: 'Dr. Vance called requesting urgent HIPAA compliance documentation for healthcare deployment. Claire safely escalated to senior compliance officer.',
      customerIntent: 'HIPAA BAA agreement & compliance escalation',
      keyTopics: JSON.stringify(['HIPAA BAA', 'Healthcare Security', 'Human Escalation']),
      actionItems: JSON.stringify(['Compliance officer to email standard BAA pack to Dr. Rebecca Vance']),
      followUpRequired: true,
      sentimentScore: 0.45,
      extractedFields: JSON.stringify({ caller: 'Dr. Rebecca Vance', reason: 'HIPAA documentation requirement' }),
    },
  });

  console.log('✓ Created calls, transcripts, summaries, and tool executions');

  // 10. Knowledge Base
  const kb = await prisma.knowledgeBase.create({
    data: {
      organizationId: org.id,
      name: 'Apex Global Enterprise Knowledge Base',
      description: 'Official corporate documentation, appointment policies, SLA schedules, and product guides',
      embeddingModel: 'text-embedding-3-small',
    },
  });

  const doc1 = await prisma.knowledgeDocument.create({
    data: {
      knowledgeBaseId: kb.id,
      title: 'Appointment Booking & Consultation Policy',
      sourceType: 'TEXT',
      originalContent: `Apex Global Technologies Enterprise Consultation Guidelines:
1. Discovery sessions are scheduled for 45 minutes on weekdays between 08:30 and 17:30 EST.
2. Prospective enterprise accounts with over 25 seats qualify for dedicated solutions engineering assistance.
3. Cancellations must be provided at least 2 hours prior to start time to allow schedule re-allocation.
4. All meetings are hosted via secure Google Meet or Zoom with dial-in audio bridges.`,
      chunkCount: 2,
      status: 'PROCESSED',
    },
  });

  await prisma.knowledgeChunk.create({
    data: {
      documentId: doc1.id,
      chunkIndex: 0,
      content: 'Apex Global Technologies Enterprise Consultation Guidelines: Discovery sessions are scheduled for 45 minutes on weekdays between 08:30 and 17:30 EST.',
      metadata: JSON.stringify({ source: 'Appointment Policy', section: 'SLA' }),
      embedding: JSON.stringify([0.021, -0.043, 0.089, 0.012, 0.054]),
    },
  });

  const doc2 = await prisma.knowledgeDocument.create({
    data: {
      knowledgeBaseId: kb.id,
      title: 'Order Shipping, Freight, and Returns SLA',
      sourceType: 'TEXT',
      originalContent: `Apex Global Hardware & Telephony Devices Logistics:
1. Standard orders ship within 24 hours of payment authorization via FedEx Priority or UPS Ground.
2. Tracking numbers are generated upon warehouse scan and updated in customer portal.
3. 30-day money-back guarantee applies to all SIP conference phones and edge gateways.
4. Returns require an RMA number issued by customer care or David AI voice support.`,
      chunkCount: 2,
      status: 'PROCESSED',
    },
  });

  await prisma.knowledgeChunk.create({
    data: {
      documentId: doc2.id,
      chunkIndex: 0,
      content: 'Standard orders ship within 24 hours of payment authorization via FedEx Priority or UPS Ground. 30-day money-back guarantee applies with RMA.',
      metadata: JSON.stringify({ source: 'Logistics SLA', section: 'Returns' }),
      embedding: JSON.stringify([0.018, 0.032, -0.012, 0.091, 0.044]),
    },
  });

  console.log('✓ Created knowledge base with documents and vector chunks');

  // 11. Visual Workflow
  const sampleWorkflow = await prisma.workflow.create({
    data: {
      organizationId: org.id,
      name: 'Smart Clinic & Reception Call Flow',
      description: 'Intelligent multi-branch routing with automated appointment booking and sentiment escalation',
      status: 'PUBLISHED',
    },
  });

  const workflowVersion = await prisma.workflowVersion.create({
    data: {
      workflowId: sampleWorkflow.id,
      versionNumber: 1,
      definition: JSON.stringify({
        nodes: [
          { id: 'node_start', type: 'START', label: 'Call Connected', position: { x: 100, y: 150 }, data: {} },
          { id: 'node_greeting', type: 'SPEAK', label: 'Play Greeting', position: { x: 300, y: 150 }, data: { message: 'Thank you for calling Apex Global. How can I help you?' } },
          { id: 'node_listen', type: 'LISTEN', label: 'Detect Intent', position: { x: 500, y: 150 }, data: { timeoutSeconds: 4 } },
          { id: 'node_branch', type: 'BRANCH_CONDITION', label: 'Intent Classifier', position: { x: 720, y: 150 }, data: { branches: ['Booking', 'Order Status', 'Transfer'] } },
          { id: 'node_tool_cal', type: 'CALL_TOOL', label: 'Check Availability', position: { x: 960, y: 80 }, data: { toolName: 'check_calendar_availability' } },
          { id: 'node_tool_order', type: 'CALL_TOOL', label: 'Lookup Order', position: { x: 960, y: 180 }, data: { toolName: 'lookup_order_status' } },
          { id: 'node_transfer', type: 'TRANSFER_HUMAN', label: 'Escalate to Agent', position: { x: 960, y: 280 }, data: { targetNumber: '+15559990000' } },
          { id: 'node_end', type: 'END', label: 'End Call Gracefully', position: { x: 1200, y: 150 }, data: { farewell: 'Have a great day!' } },
        ],
        edges: [
          { id: 'e1', source: 'node_start', target: 'node_greeting' },
          { id: 'e2', source: 'node_greeting', target: 'node_listen' },
          { id: 'e3', source: 'node_listen', target: 'node_branch' },
          { id: 'e4', source: 'node_branch', target: 'node_tool_cal', condition: 'Booking' },
          { id: 'e5', source: 'node_branch', target: 'node_tool_order', condition: 'Order Status' },
          { id: 'e6', source: 'node_branch', target: 'node_transfer', condition: 'Transfer' },
          { id: 'e7', source: 'node_tool_cal', target: 'node_end' },
          { id: 'e8', source: 'node_tool_order', target: 'node_end' },
        ],
      }),
    },
  });

  await prisma.workflow.update({
    where: { id: sampleWorkflow.id },
    data: { currentVersionId: workflowVersion.id },
  });

  console.log('✓ Created visual workflow nodes and edges');

  // 12. Integrations
  const integrations = [
    { provider: 'TWILIO', status: 'CONNECTED', config: JSON.stringify({ accountSid: 'AC_demo_mock_verified', primaryNumber: '+15552348901' }) },
    { provider: 'DEEPGRAM', status: 'CONNECTED', config: JSON.stringify({ model: 'nova-2', smartFormat: true }) },
    { provider: 'ELEVENLABS', status: 'CONNECTED', config: JSON.stringify({ defaultVoice: 'Rachel', stability: 0.75 }) },
    { provider: 'OPENAI', status: 'CONNECTED', config: JSON.stringify({ defaultModel: 'gpt-4o', orgScoped: true }) },
    { provider: 'HUBSPOT', status: 'CONNECTED', config: JSON.stringify({ syncContacts: true, createDeals: true }) },
    { provider: 'GOOGLE_CALENDAR', status: 'CONNECTED', config: JSON.stringify({ defaultCalendarId: 'c_apex_consults@group.calendar.google.com' }) },
    { provider: 'STRIPE', status: 'CONNECTED', config: JSON.stringify({ plan: 'PROFESSIONAL', billingCycle: 'MONTHLY' }) },
  ];

  for (const integ of integrations) {
    await prisma.integrationConnection.create({
      data: {
        organizationId: org.id,
        ...integ,
        credentialsEncrypted: 'enc_token_demo_valid_99812',
      },
    });
  }

  // 13. Subscription
  await prisma.subscription.create({
    data: {
      organizationId: org.id,
      tier: 'PROFESSIONAL',
      status: 'ACTIVE',
      currentPeriodStart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
      currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 16),
      stripeCustomerId: 'cus_demo_apex987',
      stripeSubscriptionId: 'sub_demo_apex123',
    },
  });

  // 14. Audit Log
  await prisma.auditLog.createMany({
    data: [
      { organizationId: org.id, userId: owner.id, action: 'ORGANIZATION_CREATED', resourceType: 'ORGANIZATION', resourceId: org.id, details: JSON.stringify({ name: org.name }), ipAddress: '192.168.1.1' },
      { organizationId: org.id, userId: owner.id, action: 'AGENT_PUBLISHED', resourceType: 'AGENT', resourceId: receptionist.id, details: JSON.stringify({ version: 1, name: receptionist.name }), ipAddress: '192.168.1.1' },
      { organizationId: org.id, userId: admin.id, action: 'CAMPAIGN_STARTED', resourceType: 'CAMPAIGN', resourceId: campaign.id, details: JSON.stringify({ name: campaign.name }), ipAddress: '192.168.1.25' },
    ],
  });

  console.log('✅ Database seeded successfully with enterprise demo records!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
