import { z } from 'zod';
import {
  AgentConfigSchema,
  CreateAgentSchema,
  CreateCampaignSchema,
  CreateContactSchema,
  IngestDocumentSchema,
  InitiateCallSchema,
  LoginSchema,
  RegisterSchema,
  SaveWorkflowSchema,
  ToolDefinitionSchema,
  VoiceConfigSchema,
  WorkflowDefinitionSchema,
  WorkflowNodeSchema,
} from './schemas';

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type AgentConfig = z.infer<typeof AgentConfigSchema>;
export type CreateAgentInput = z.infer<typeof CreateAgentSchema>;
export type VoiceConfig = z.infer<typeof VoiceConfigSchema>;
export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;
export type CreateContactInput = z.infer<typeof CreateContactSchema>;
export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;
export type InitiateCallInput = z.infer<typeof InitiateCallSchema>;
export type WorkflowNode = z.infer<typeof WorkflowNodeSchema>;
export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;
export type SaveWorkflowInput = z.infer<typeof SaveWorkflowSchema>;
export type IngestDocumentInput = z.infer<typeof IngestDocumentSchema>;

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    version?: string;
  };
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
