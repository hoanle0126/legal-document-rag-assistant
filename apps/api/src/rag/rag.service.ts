import { Injectable, Logger } from '@nestjs/common';
import { VectorService } from '../vector/vector.service';
import { AiService } from '../ai/ai.service';
import { PromptBuilderService } from './prompt-builder.service';
import { CitationValidatorService } from './citation-validator.service';
import {
  RagQueryOptions,
  RagAnswerResult,
  VIETNAMESE_LEGAL_DISCLAIMER,
  INSUFFICIENT_CONTEXT_MESSAGE,
} from '@legal-rag/shared';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly vectorService: VectorService,
    private readonly aiService: AiService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly citationValidator: CitationValidatorService,
  ) {}

  /**
   * Complete End-to-End Grounded Legal RAG Pipeline
   */
  async answerQuestion(
    question: string,
    options: RagQueryOptions = {},
  ): Promise<RagAnswerResult> {
    const startTime = Date.now();
    const cleanQuestion = (question || '').trim();

    this.logger.log(`Bắt đầu xử lý câu hỏi RAG: "${cleanQuestion}"`);

    // 1. Obtain active AI providers
    const embeddingProvider = this.aiService.getEmbeddingProvider();
    const llmProvider = this.aiService.getLlmProvider();

    // 2. Generate embedding for user query
    const queryEmbedding = await embeddingProvider.embedQuery(cleanQuestion);

    // 3. Perform Hybrid Semantic + Full-Text Search in pgvector
    const topK = options.topK || 5;
    const similarityThreshold = options.similarityThreshold || 0.45;

    const retrievedChunks = await this.vectorService.searchHybrid({
      query: cleanQuestion,
      embedding: queryEmbedding,
      topK,
      similarityThreshold,
      documentIds: options.documentIds,
      documentTypes: options.documentTypes,
    });

    // 4. Insufficient Context Guard (Retrieval-level)
    const topChunk = retrievedChunks[0];
    const isInsufficientRetrieval =
      !topChunk ||
      topChunk.hybridScore < 0.18 ||
      (topChunk.keywordScore === 0 && topChunk.similarity < 0.35);

    if (isInsufficientRetrieval) {
      this.logger.warn(`Không tìm thấy đủ căn cứ pháp lý cho câu hỏi: "${cleanQuestion}"`);
      return {
        answer: INSUFFICIENT_CONTEXT_MESSAGE,
        confidence: 'low',
        insufficientContext: true,
        citations: [],
        retrievedChunks,
        executionTimeMs: Date.now() - startTime,
        provider: `${llmProvider.name}+${embeddingProvider.name}`,
        disclaimer: VIETNAMESE_LEGAL_DISCLAIMER,
      };
    }

    // 5. Construct secure prompts isolating untrusted context
    const systemPrompt = this.promptBuilder.buildSystemPrompt();
    const userPrompt = this.promptBuilder.buildUserPrompt(cleanQuestion, retrievedChunks);

    // 6. Generate answer from LLM with structured output contract
    const llmResult = await llmProvider.generateGroundedAnswer({
      systemPrompt,
      userPrompt,
      temperature: 0.1,
    });

    // Handle LLM-level insufficient context detection
    if (llmResult.insufficientContext) {
      this.logger.warn(`LLM xác định ngữ cảnh không đủ trả lời câu hỏi: "${cleanQuestion}"`);
      return {
        answer: llmResult.answer || INSUFFICIENT_CONTEXT_MESSAGE,
        confidence: 'low',
        insufficientContext: true,
        citations: [],
        retrievedChunks,
        executionTimeMs: Date.now() - startTime,
        provider: `${llmProvider.name}+${embeddingProvider.name}`,
        disclaimer: VIETNAMESE_LEGAL_DISCLAIMER,
      };
    }

    // 7. Backend citation validation: filter out any fake or non-existent citations
    const verifiedCitations = this.citationValidator.validateCitations(
      llmResult.citations || [],
      retrievedChunks,
    );

    // Adjust confidence if citations failed validation
    let finalConfidence = llmResult.confidence;
    if (verifiedCitations.length === 0) {
      finalConfidence = 'medium';
    }

    const executionTimeMs = Date.now() - startTime;
    this.logger.log(
      `Hoàn thành RAG trong ${executionTimeMs}ms. Trích dẫn hợp lệ: ${verifiedCitations.length}. Độ tin cậy: ${finalConfidence}`,
    );

    return {
      answer: llmResult.answer,
      confidence: finalConfidence,
      insufficientContext: false,
      citations: verifiedCitations,
      retrievedChunks,
      executionTimeMs,
      provider: `${llmProvider.name}+${embeddingProvider.name}`,
      disclaimer: VIETNAMESE_LEGAL_DISCLAIMER,
    };
  }
}
