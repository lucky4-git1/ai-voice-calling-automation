import { Injectable, Logger } from '@nestjs/common';
import { TextToSpeechProvider, TTSResult } from '../interfaces/voice.interfaces';

@Injectable()
export class MockTTSAdapter implements TextToSpeechProvider {
  name = 'MOCK_TTS';
  async synthesizeSpeech(text: string, voiceId = 'default', speed = 1.0): Promise<TTSResult> {
    const estimatedDurationMs = Math.round((text.length / 15) * 1000 * (1 / speed));
    return {
      audioUrl: `https://storage.callagent-demo.internal/tts/${Date.now()}.wav`,
      durationMs: Math.max(1200, estimatedDurationMs),
      characterCount: text.length,
    };
  }
}

@Injectable()
export class ElevenLabsTTSAdapter implements TextToSpeechProvider {
  name = 'ELEVENLABS';
  private readonly logger = new Logger(ElevenLabsTTSAdapter.name);
  private apiKey = process.env.ELEVENLABS_API_KEY;

  async synthesizeSpeech(text: string, voiceId = '21m00Tcm4TlvDq8ikWAM', speed = 1.0): Promise<TTSResult> {
    if (!this.apiKey) {
      return new MockTTSAdapter().synthesizeSpeech(text, voiceId, speed);
    }

    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            speed,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`ElevenLabs returned ${res.status}`);
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      return {
        audioBuffer: buffer,
        audioUrl: `data:audio/mp3;base64,${buffer.toString('base64').substring(0, 50)}...`,
        durationMs: Math.round((text.length / 14) * 1000),
        characterCount: text.length,
      };
    } catch (err: any) {
      this.logger.error(`ElevenLabs TTS failed: ${err.message}. Using mock.`);
      return new MockTTSAdapter().synthesizeSpeech(text, voiceId, speed);
    }
  }
}
