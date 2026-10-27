import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import { VoiceOrchestratorService } from '../src/modules/voice-runtime/voice-orchestrator.service';
import { TwilioTelephonyAdapter, MockTelephonyAdapter } from '../src/modules/voice-runtime/adapters/telephony.adapter';
import { DeepgramSTTAdapter, MockSTTAdapter } from '../src/modules/voice-runtime/adapters/stt.adapter';
import { ElevenLabsTTSAdapter, MockTTSAdapter } from '../src/modules/voice-runtime/adapters/tts.adapter';
import { OpenAILLMAdapter, MockLLMAdapter } from '../src/modules/voice-runtime/adapters/llm.adapter';

describe('Voice Runtime Orchestrator Pipeline', () => {
  const prisma = new PrismaClient();

  const service = new VoiceOrchestratorService(
    prisma as any,
    new TwilioTelephonyAdapter(),
    new MockTelephonyAdapter(),
    new DeepgramSTTAdapter(),
    new MockSTTAdapter(),
    new ElevenLabsTTSAdapter(),
    new MockTTSAdapter(),
    new OpenAILLMAdapter(),
    new MockLLMAdapter(),
  );

  test('Inbound call creates active session and resolves correct agent', async () => {
    // NYC Primary Line (+15552348901) is assigned to Claire
    const result = await service.handleInboundCall('+15552348901', '+14155550111');

    assert.strictEqual(result.status, 'CONNECTED');
    assert.ok(result.sessionId);
    assert.ok(result.greetingMessage.includes('Claire'));

    // Test a conversational turn requesting an appointment
    const turnResult = await service.processTurn(result.sessionId, 'I would like to schedule an appointment for Friday.');
    assert.ok(turnResult.reply);
    assert.ok(turnResult.latencyMs >= 0);

    // Finalize session
    const finalCall = await service.finalizeCall(result.sessionId, 'COMPLETED');
    assert.strictEqual(finalCall?.status, 'COMPLETED');
  });
});
