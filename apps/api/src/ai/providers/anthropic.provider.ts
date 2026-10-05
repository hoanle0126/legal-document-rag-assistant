import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  LlmProvider,
  LlmGenerationOptions,
  StructuredLlmResponse,
} from '../interfaces/ai-provider.interface';

@Injectable()
export class AnthropicProvider implements LlmProvider {
  readonly name = 'anthropic';
  private readonly logger = new Logger(AnthropicProvider.name);
  private client: Anthropic | null = null;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    this.model = this.configService.get<string>('ANTHROPIC_MODEL') || 'claude-3-5-haiku-20241022';

    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    }
  }

  async generateGroundedAnswer(options: LlmGenerationOptions): Promise<StructuredLlmResponse> {
    if (!this.client) {
      throw new Error('Anthropic API Key chưa được cấu hình.');
    }

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: options.maxTokens ?? 2000,
        temperature: options.temperature ?? 0.1,
        system: options.systemPrompt + '\n\nBẮT BUỘC: Chỉ trả về duy nhất chuỗi JSON hợp lệ theo cấu trúc được yêu cầu, không kèm bất kỳ lời dẫn giải nào.',
        messages: [{ role: 'user', content: options.userPrompt }],
      });

      const firstBlock = response.content[0];
      const raw = firstBlock.type === 'text' ? firstBlock.text : '{}';

      // Clean markdown code blocks if wrapped
      const cleanJson = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleanJson);

      return {
        answer: parsed.answer || '',
        confidence: parsed.confidence || 'medium',
        insufficientContext: Boolean(parsed.insufficientContext),
        citations: Array.isArray(parsed.citations) ? parsed.citations : [],
        rawResponse: raw,
        providerName: this.name,
      };
    } catch (err: any) {
      this.logger.error(`Anthropic error: ${err.message}`, err.stack);
      throw err;
    }
  }
}
