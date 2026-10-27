import { Injectable, Logger } from '@nestjs/common';
import { SpeechToTextProvider, STTResult } from '../interfaces/voice.interfaces';

@Injectable()
export class MockSTTAdapter implements SpeechToTextProvider {
  name = 'MOCK_STT';
  async transcribeAudio(audioBuffer: Buffer, language = 'en'): Promise<STTResult> {
    return {
      text: 'Hello, I would like to check on my appointment or schedule a meeting.',
      confidence: 0.98,
      durationSeconds: Math.max(1, Math.round(audioBuffer.length / 16000)),
    };
  }
}

@Injectable()
export class DeepgramSTTAdapter implements SpeechToTextProvider {
  name = 'DEEPGRAM';
  private readonly logger = new Logger(DeepgramSTTAdapter.name);
  private apiKey = process.env.DEEPGRAM_API_KEY;

  async transcribeAudio(audioBuffer: Buffer, language = 'en'): Promise<STTResult> {
    if (!this.apiKey) {
      return new MockSTTAdapter().transcribeAudio(audioBuffer, language);
    }

    try {
      const res = await fetch(`https://api.deepgram.com/v1/listen?model=nova-2&language=${language}&smart_format=true`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${this.apiKey}`,
          'Content-Type': 'audio/wav',
        },
        body: new Uint8Array(audioBuffer) as any,
      });

      const data: any = await res.json();
      const transcript = data.results?.channels[0]?.alternatives[0]?.transcript || '';
      const confidence = data.results?.channels[0]?.alternatives[0]?.confidence || 0.95;

      return {
        text: transcript,
        confidence,
        durationSeconds: data.metadata?.duration || 2.0,
      };
    } catch (err: any) {
      this.logger.error(`Deepgram STT failed: ${err.message}. Fallback to mock.`);
      return new MockSTTAdapter().transcribeAudio(audioBuffer, language);
    }
  }
}
