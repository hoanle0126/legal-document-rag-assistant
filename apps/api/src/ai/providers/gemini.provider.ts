import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import {
  LlmProvider,
  EmbeddingProvider,
  LlmGenerationOptions,
  StructuredLlmResponse,
} from '../interfaces/ai-provider.interface';

@Injectable()
export class GeminiProvider implements LlmProvider, EmbeddingProvider {
  readonly name = 'gemini';
  readonly dimension = 1536; // Padded or normalized if 768
  private readonly logger = new Logger(GeminiProvider.name);
  private ai: GoogleGenAI | null = null;
  private readonly model: string;
  private readonly embeddingModel: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.model = this.configService.get<string>('GEMINI_MODEL') || 'gemini-1.5-flash';
    this.embeddingModel = this.configService.get<string>('GEMINI_EMBEDDING_MODEL') || 'text-embedding-004';

    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  async generateGroundedAnswer(options: LlmGenerationOptions): Promise<StructuredLlmResponse> {
    if (!this.ai) {
      throw new Error('Gemini API Key chưa được cấu hình.');
    }

    try {
      const prompt = `${options.systemPrompt}\n\n${options.userPrompt}`;
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: options.temperature ?? 0.1,
        },
      });

      const raw = response.text || '{}';
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
      this.logger.error(`Gemini error: ${err.message}`, err.stack);
      throw err;
    }
  }

  async embedQuery(text: string): Promise<number[]> {
    if (!this.ai) {
      throw new Error('Gemini API Key chưa được cấu hình.');
    }
    const res = await this.ai.models.embedContent({
      model: this.embeddingModel,
      contents: text,
    });
    const values = (res as any).embedding?.values || [];
    return this.normalizeTo1536(values);
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.embedQuery(t)));
  }

  private normalizeTo1536(vec: number[]): number[] {
    if (vec.length === 1536) return vec;
    const result = new Array(1536).fill(0);
    for (let i = 0; i < Math.min(vec.length, 1536); i++) {
      result[i] = vec[i];
    }
    return result;
  }
}
