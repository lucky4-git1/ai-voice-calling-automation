import { Module } from '@nestjs/common';
import { VoiceController } from './voice.controller';
import { VoiceOrchestratorService } from './voice-orchestrator.service';
import { MockTelephonyAdapter, TwilioTelephonyAdapter } from './adapters/telephony.adapter';
import { MockSTTAdapter, DeepgramSTTAdapter } from './adapters/stt.adapter';
import { MockTTSAdapter, ElevenLabsTTSAdapter } from './adapters/tts.adapter';
import { MockLLMAdapter, OpenAILLMAdapter } from './adapters/llm.adapter';

@Module({
  controllers: [VoiceController],
  providers: [
    VoiceOrchestratorService,
    MockTelephonyAdapter,
    TwilioTelephonyAdapter,
    MockSTTAdapter,
    DeepgramSTTAdapter,
    MockTTSAdapter,
    ElevenLabsTTSAdapter,
    MockLLMAdapter,
    OpenAILLMAdapter,
  ],
  exports: [VoiceOrchestratorService],
})
export class VoiceModule {}
