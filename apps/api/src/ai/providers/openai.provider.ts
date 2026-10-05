import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  LlmProvider,
  EmbeddingProvider,
  LlmGenerationOptions,
  StructuredLlmResponse,
} from '../interfaces/ai-provider.interface';

@Injectable()
export class OpenAiProvider implements LlmProvider, EmbeddingProvider {
  readonly name = 'openai';
  readonly dimension = 1536;
  private readonly logger = new Logger(OpenAiProvider.name);
  private client: OpenAI | null = null;
  private readonly model: string;
  private readonly embeddingModel: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
    this.embeddingModel = this.configService.get<string>('OPENAI_EMBEDDING_MODEL') || 'text-embedding-3-small';

    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  async generateGroundedAnswer(options: LlmGenerationOptions): Promise<StructuredLlmResponse> {
    if (!this.client) {
      throw new Error('OpenAI API Key chưa được cấu hình.');
    }

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        temperature: options.temperature ?? 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: options.systemPrompt },
          { role: 'user', content: options.userPrompt },
        ],
      });

      const raw = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(raw);

      return {
        answer: parsed.answer || '',
        confidence: parsed.confidence || 'medium',
        insufficientContext: Boolean(parsed.insufficientContext),
        citations: Array.isArray(parsed.citations) ? parsed.citations : [],
        rawResponse: raw,
        providerName: this.name,
      };
    } catch (err: any) {
      this.logger.error(`OpenAI error: ${err.message}`, err.stack);
      throw err;
    }
  }

  async embedQuery(text: string): Promise<number[]> {
    if (!this.client) {
      throw new Error('OpenAI API Key chưa được cấu hình.');
    }
    const res = await this.client.embeddings.create({
      model: this.embeddingModel,
      input: text,
      dimensions: this.dimension,
    });
    return res.data[0].embedding;
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    if (!this.client) {
      throw new Error('OpenAI API Key chưa được cấu hình.');
    }
    const res = await this.client.embeddings.create({
      model: this.embeddingModel,
      input: texts,
      dimensions: this.dimension,
    });
    return res.data.map((d) => d.embedding);
  }
}
