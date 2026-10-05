import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { MockLlmProvider } from './providers/mock-llm.provider';
import { MockEmbeddingProvider } from './providers/mock-embedding.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { AnthropicProvider } from './providers/anthropic.provider';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    AiService,
    MockLlmProvider,
    MockEmbeddingProvider,
    OpenAiProvider,
    GeminiProvider,
    AnthropicProvider,
  ],
  exports: [
    AiService,
    MockLlmProvider,
    MockEmbeddingProvider,
    OpenAiProvider,
    GeminiProvider,
    AnthropicProvider,
  ],
})
export class AiModule {}
