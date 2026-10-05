import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProvider, EmbeddingProvider } from './interfaces/ai-provider.interface';
import { MockLlmProvider } from './providers/mock-llm.provider';
import { MockEmbeddingProvider } from './providers/mock-embedding.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { AnthropicProvider } from './providers/anthropic.provider';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private activeLlmProviderName: string;
  private activeEmbeddingProviderName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly mockLlm: MockLlmProvider,
    private readonly mockEmbedding: MockEmbeddingProvider,
    private readonly openAi: OpenAiProvider,
    private readonly gemini: GeminiProvider,
    private readonly anthropic: AnthropicProvider,
  ) {
    this.activeLlmProviderName = this.configService.get<string>('LLM_PROVIDER') || 'mock';
    this.activeEmbeddingProviderName = this.configService.get<string>('EMBEDDING_PROVIDER') || 'mock';
    this.logger.log(
      `AI Service initialized. LLM Provider: ${this.activeLlmProviderName} | Embedding Provider: ${this.activeEmbeddingProviderName}`,
    );
  }

  getLlmProvider(overrideName?: string): LlmProvider {
    const name = (overrideName || this.activeLlmProviderName).toLowerCase();
    switch (name) {
      case 'openai':
        return this.openAi;
      case 'gemini':
        return this.gemini;
      case 'anthropic':
        return this.anthropic;
      case 'mock':
      default:
        return this.mockLlm;
    }
  }

  getEmbeddingProvider(overrideName?: string): EmbeddingProvider {
    const name = (overrideName || this.activeEmbeddingProviderName).toLowerCase();
    switch (name) {
      case 'openai':
        return this.openAi;
      case 'gemini':
        return this.gemini;
      case 'mock':
      default:
        return this.mockEmbedding;
    }
  }

  setProviders(llmName?: string, embeddingName?: string) {
    if (llmName) this.activeLlmProviderName = llmName;
    if (embeddingName) this.activeEmbeddingProviderName = embeddingName;
    this.logger.log(`Switched providers: LLM=${this.activeLlmProviderName}, Embedding=${this.activeEmbeddingProviderName}`);
  }

  getCurrentProviderInfo() {
    return {
      llmProvider: this.activeLlmProviderName,
      embeddingProvider: this.activeEmbeddingProviderName,
      supportedLlmProviders: ['mock', 'openai', 'gemini', 'anthropic'],
      supportedEmbeddingProviders: ['mock', 'openai', 'gemini'],
    };
  }
}
