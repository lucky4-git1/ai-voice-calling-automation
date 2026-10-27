export interface TelephonyCallResult {
  providerCallSid: string;
  status: 'INITIATING' | 'RINGING' | 'IN_PROGRESS' | 'FAILED';
  rawResponse?: any;
}

export interface TelephonyProvider {
  name: string;
  initiateOutboundCall(to: string, from: string, webhookUrl: string): Promise<TelephonyCallResult>;
  terminateCall(providerCallSid: string): Promise<boolean>;
  transferCall(providerCallSid: string, targetNumber: string): Promise<boolean>;
  verifyWebhookSignature(headers: Record<string, string>, body: any): boolean;
}

export interface STTResult {
  text: string;
  confidence: number;
  durationSeconds: number;
}

export interface SpeechToTextProvider {
  name: string;
  transcribeAudio(audioBuffer: Buffer, language?: string): Promise<STTResult>;
}

export interface TTSResult {
  audioBuffer?: Buffer;
  audioUrl?: string;
  durationMs: number;
  characterCount: number;
}

export interface TextToSpeechProvider {
  name: string;
  synthesizeSpeech(text: string, voiceId: string, speed?: number): Promise<TTSResult>;
}

export interface LLMResponse {
  text: string;
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, any>;
  }>;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMProvider {
  name: string;
  generateTurn(
    systemPrompt: string,
    history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    availableTools?: any[],
  ): Promise<LLMResponse>;
}
