import { z } from 'zod';
import {
  AgentStatus,
  CallDirection,
  CallStatus,
  CampaignRecipientStatus,
  CampaignStatus,
  ConsentStatus,
  LLMProviderType,
  STTProviderType,
  TelephonyProviderType,
  TTSProviderType,
  UserRole,
  VoiceEngineType,
  WorkflowNodeType,
} from './enums';

// Authentication
export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

// Organization & Members
export const CreateOrganizationSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
});

export const InviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
});

// Agent Configuration
export const ToolParameterSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
  description: z.string(),
  required: z.boolean().default(false),
});

export const ToolDefinitionSchema = z.object({
  id: z.string().optional(),
  name: z.string().regex(/^[a-zA-Z0-9_]+$/, 'Tool name must be alphanumeric with underscores'),
  description: z.string(),
  parameters: z.array(ToolParameterSchema).default([]),
  endpointUrl: z.string().url().optional(),
  requiresConfirmation: z.boolean().default(false),
  enabled: z.boolean().default(true),
});

export const VoiceConfigSchema = z.object({
  engineType: z.nativeEnum(VoiceEngineType).default(VoiceEngineType.CHAINED_PIPELINE),
  sttProvider: z.nativeEnum(STTProviderType).default(STTProviderType.DEEPGRAM),
  sttModel: z.string().default('nova-2'),
  sttLanguage: z.string().default('en'),
  llmProvider: z.nativeEnum(LLMProviderType).default(LLMProviderType.OPENAI),
  llmModel: z.string().default('gpt-4o-mini'),
  temperature: z.number().min(0).max(2).default(0.7),
  ttsProvider: z.nativeEnum(TTSProviderType).default(TTSProviderType.ELEVENLABS),
  ttsVoiceId: z.string().default('21m00Tcm4TlvDq8ikWAM'), // Rachel default
  ttsSpeed: z.number().min(0.5).max(2.0).default(1.0),
  interruptionSensitivity: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  silenceTimeoutMs: z.number().min(1000).max(10000).default(3500),
  maxCallDurationSeconds: z.number().min(30).max(3600).default(900),
  ambientSound: z.enum(['NONE', 'OFFICE', 'CAFE']).default('NONE'),
});

export const AgentConfigSchema = z.object({
  name: z.string().min(2, 'Agent name required'),
  description: z.string().optional(),
  businessPurpose: z.string().min(5, 'State clear business purpose'),
  systemPrompt: z.string().min(20, 'System instructions must be at least 20 characters'),
  greetingMessage: z.string().min(2, 'Initial greeting is required'),
  fallbackMessage: z.string().default('I apologize, I am having trouble understanding. Could you please repeat that?'),
  endOfCallMessage: z.string().default('Thank you for calling. Have a wonderful day!'),
  voiceConfig: VoiceConfigSchema,
  tools: z.array(ToolDefinitionSchema).default([]),
  knowledgeBaseIds: z.array(z.string()).default([]),
  businessHours: z.object({
    enabled: z.boolean().default(false),
    timezone: z.string().default('UTC'),
    schedule: z.record(z.object({ start: z.string(), end: z.string(), closed: z.boolean() })).optional(),
  }).default({ enabled: false, timezone: 'UTC' }),
  escalationRules: z.object({
    allowHumanTransfer: z.boolean().default(true),
    transferPhoneNumber: z.string().optional(),
    escalationTriggerPhrases: z.array(z.string()).default(['speak to a person', 'representative', 'agent', 'operator']),
  }).default({ allowHumanTransfer: true, escalationTriggerPhrases: [] }),
});

export const CreateAgentSchema = AgentConfigSchema;

export const UpdateAgentSchema = AgentConfigSchema.partial();

// Phone Numbers
export const AssignPhoneNumberSchema = z.object({
  phoneNumberId: z.string(),
  agentId: z.string().nullable(),
  friendlyName: z.string().optional(),
  inboundWebhookUrl: z.string().url().optional(),
});

// Contacts & DNC
export const CreateContactSchema = z.object({
  phoneNumber: z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Must be a valid E.164 phone number'),
  name: z.string().optional(),
  email: z.string().email().optional(),
  company: z.string().optional(),
  timezone: z.string().default('UTC'),
  consentStatus: z.nativeEnum(ConsentStatus).default(ConsentStatus.EXPRESS),
  consentSource: z.string().optional(),
  customFields: z.record(z.any()).default({}),
  tags: z.array(z.string()).default([]),
  isDncSuppressed: z.boolean().default(false),
});

export const BulkImportContactsSchema = z.object({
  contacts: z.array(CreateContactSchema).min(1, 'At least 1 contact required'),
  overwriteExisting: z.boolean().default(false),
  defaultConsentSource: z.string().min(1, 'Consent source must be stated'),
});

// Outbound Campaigns
export const CreateCampaignSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  agentId: z.string(),
  callerIdNumber: z.string(),
  contactIds: z.array(z.string()).min(1, 'Select at least one contact'),
  concurrencyLimit: z.number().min(1).max(50).default(5),
  maxRetriesPerContact: z.number().min(0).max(3).default(1),
  callingWindowStart: z.string().regex(/^\d{2}:\d{2}$/).default('09:00'),
  callingWindowEnd: z.string().regex(/^\d{2}:\d{2}$/).default('18:00'),
  timezoneEnforcement: z.enum(['RECIPIENT_LOCAL', 'ORGANIZATION_TIMEZONE']).default('RECIPIENT_LOCAL'),
  budgetLimitCents: z.number().min(100).optional(),
});

// Calls
export const InitiateCallSchema = z.object({
  agentId: z.string(),
  recipientPhoneNumber: z.string().regex(/^\+?[1-9]\d{6,14}$/),
  callerIdNumber: z.string().optional(),
  contactId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  direction: z.nativeEnum(CallDirection).default(CallDirection.OUTBOUND),
});

// Workflows
export const WorkflowNodeSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(WorkflowNodeType),
  label: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.record(z.any()).default({}),
});

export const WorkflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
  condition: z.string().optional(),
});

export const WorkflowDefinitionSchema = z.object({
  nodes: z.array(WorkflowNodeSchema),
  edges: z.array(WorkflowEdgeSchema),
});

export const SaveWorkflowSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  definition: WorkflowDefinitionSchema,
});

// Knowledge Base
export const IngestDocumentSchema = z.object({
  title: z.string().min(2),
  sourceType: z.enum(['TEXT', 'MARKDOWN', 'WEB_SCRAPE', 'FILE_UPLOAD']),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  metadata: z.record(z.any()).optional(),
});

// Integrations
export const ConfigureIntegrationSchema = z.object({
  provider: z.string(),
  credentials: z.record(z.string()),
  environment: z.enum(['DEVELOPMENT', 'STAGING', 'PRODUCTION']).default('DEVELOPMENT'),
});
