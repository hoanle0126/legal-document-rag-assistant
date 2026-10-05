import { Injectable, Logger } from '@nestjs/common';
import { Citation, RetrievedChunk, normalizeLegalText } from '@legal-rag/shared';
import { LlmCitationRef } from '../ai/interfaces/ai-provider.interface';

@Injectable()
export class CitationValidatorService {
  private readonly logger = new Logger(CitationValidatorService.name);

  /**
   * Validates that LLM citations strictly reference chunks that were actually retrieved.
   * Purges hallucinated or fake citations and enriches verified citations with authoritative metadata.
   */
  validateCitations(
    rawCitations: LlmCitationRef[],
    retrievedChunks: RetrievedChunk[],
  ): Citation[] {
    const chunkMap = new Map<string, RetrievedChunk>();
    for (const chunk of retrievedChunks) {
      chunkMap.set(chunk.chunkId, chunk);
    }

    const verifiedCitations: Citation[] = [];
    let citationCounter = 1;

    for (const raw of rawCitations) {
      // 1. Look up chunk in retrieved set
      let matchedChunk: RetrievedChunk | undefined = chunkMap.get(raw.citationId);

      // Fallback matching by documentId and article if citationId had minor variation
      if (!matchedChunk && raw.documentId) {
        matchedChunk = retrievedChunks.find(
          (c) =>
            c.documentId === raw.documentId &&
            (!raw.article || c.article === raw.article),
        );
      }

      // SECURITY & INTEGRITY: Reject fake citations not present in retrieved context
      if (!matchedChunk) {
        this.logger.warn(
          `BÁO ĐỘNG TRÍCH DẪN GIẢ MẠO/BỊA ĐẶT: LLM trả về citationId "${raw.citationId}" không có trong danh sách chunks được trích xuất. Bị loại bỏ!`,
        );
        continue;
      }

      // 2. Verify verbatim quote authenticity against chunk content
      const cleanChunk = normalizeLegalText(matchedChunk.content).toLowerCase();
      let cleanQuote = normalizeLegalText(raw.quote || '')
        .replace(/^[—\-\s]+|[—\-\s]+$/g, '')
        .toLowerCase()
        .trim();

      let isVerifiedQuote = false;
      if (cleanQuote.length > 0) {
        // Direct inclusion or substring overlap
        if (cleanChunk.includes(cleanQuote) || cleanQuote.includes(cleanChunk)) {
          isVerifiedQuote = true;
        } else {
          // Check word overlap for minor differences or ellipses
          const quoteWords = cleanQuote.split(/\s+/).filter((w) => w.length > 2);
          const matchedWords = quoteWords.filter((w) => cleanChunk.includes(w));
          const matchRatio = quoteWords.length > 0 ? matchedWords.length / quoteWords.length : 0;
          if (matchRatio >= 0.5) {
            isVerifiedQuote = true;
          }
        }
      } else {
        isVerifiedQuote = true;
      }

      verifiedCitations.push({
        citationId: matchedChunk.chunkId,
        chunkId: matchedChunk.chunkId,
        documentId: matchedChunk.documentId,
        documentTitle: matchedChunk.documentTitle,
        documentNumber: matchedChunk.documentNumber,
        article: matchedChunk.article || raw.article,
        clause: matchedChunk.clause || raw.clause,
        point: matchedChunk.point || raw.point,
        page: matchedChunk.page || raw.page,
        quote: raw.quote && raw.quote.length > 10 ? raw.quote : matchedChunk.content.slice(0, 250),
        verified: isVerifiedQuote,
        sourceUrl: matchedChunk.sourceUrl,
        hierarchyPath: matchedChunk.hierarchyPath,
      });

      citationCounter++;
    }

    this.logger.log(
      `Citation validation: ${verifiedCitations.length} hợp lệ trên ${rawCitations.length} trích dẫn do LLM trả về.`,
    );

    return verifiedCitations;
  }
}
