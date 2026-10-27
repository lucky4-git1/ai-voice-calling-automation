import { Injectable, Logger } from '@nestjs/common';
import { LLMProvider, LLMResponse } from '../interfaces/voice.interfaces';

@Injectable()
export class MockLLMAdapter implements LLMProvider {
  name = 'MOCK_LLM';
  async generateTurn(
    systemPrompt: string,
    history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    availableTools: any[] = [],
  ): Promise<LLMResponse> {
    const lastUserMsg = history[history.length - 1]?.content.toLowerCase() || '';

    if (lastUserMsg.includes('appointment') || lastUserMsg.includes('schedule') || lastUserMsg.includes('book')) {
      return {
        text: 'I would be happy to check available appointment slots for you. Let me look at Friday afternoon on our calendar.',
        toolCalls: [
          {
            name: 'check_calendar_availability',
            arguments: { date: '2026-10-30', serviceType: 'Consultation' },
          },
        ],
        tokenUsage: { promptTokens: 320, completionTokens: 48, totalTokens: 368 },
      };
    }

    if (lastUserMsg.includes('order') || lastUserMsg.includes('tracking')) {
      return {
        text: 'Let me look up that order in our logistics system for you right now.',
        toolCalls: [
          {
            name: 'lookup_order_status',
            arguments: { orderId: 'ORD-99214' },
          },
        ],
        tokenUsage: { promptTokens: 290, completionTokens: 36, totalTokens: 326 },
      };
    }

    return {
      text: 'Thank you for reaching out. I understand your request and am ready to assist. How else may I help?',
      tokenUsage: { promptTokens: 250, completionTokens: 30, totalTokens: 280 },
    };
  }
}

@Injectable()
export class OpenAILLMAdapter implements LLMProvider {
  name = 'OPENAI';
  private readonly logger = new Logger(OpenAILLMAdapter.name);
  private apiKey = process.env.OPENAI_API_KEY;

  async generateTurn(
    systemPrompt: string,
    history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    availableTools: any[] = [],
  ): Promise<LLMResponse> {
    if (!this.apiKey) {
      return new MockLLMAdapter().generateTurn(systemPrompt, history, availableTools);
    }

    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history,
      ];

      const body: any = {
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.6,
      };

      if (availableTools.length > 0) {
        body.tools = availableTools.map((t) => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: {
              type: 'object',
              properties: (t.parameters || []).reduce((acc: any, p: any) => {
                acc[p.name] = { type: p.type, description: p.description };
                return acc;
              }, {}),
              required: (t.parameters || []).filter((p: any) => p.required).map((p: any) => p.name),
            },
          },
        }));
      }

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data: any = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'OpenAI API call failed');
      }

      const choice = data.choices[0];
      const toolCalls = choice.message.tool_calls?.map((tc: any) => ({
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments || '{}'),
      }));

      return {
        text: choice.message.content || '',
        toolCalls,
        tokenUsage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
      };
    } catch (err: any) {
      this.logger.error(`OpenAI LLM turn failed: ${err.message}. Using mock fallback.`);
      return new MockLLMAdapter().generateTurn(systemPrompt, history, availableTools);
    }
  }
}
