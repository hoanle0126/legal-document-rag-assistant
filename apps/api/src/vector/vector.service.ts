import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RetrievedChunk, LegalDocumentType } from '@legal-rag/shared';
import { Prisma } from '@prisma/client';

export interface HybridSearchOptions {
  query: string;
  embedding: number[];
  topK?: number;
  similarityThreshold?: number;
  documentIds?: string[];
  documentTypes?: LegalDocumentType[];
}

@Injectable()
export class VectorService {
  private readonly logger = new Logger(VectorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Updates vector embedding for a specific document chunk.
   */
  async updateChunkEmbedding(chunkId: string, embedding: number[]): Promise<void> {
    const vectorStr = `[${embedding.join(',')}]`;
    await this.prisma.$executeRaw`
      UPDATE "document_chunks"
      SET "embedding" = ${vectorStr}::vector
      WHERE "id" = ${chunkId}
    `;
  }

  /**
   * Batch update vector embeddings for multiple document chunks.
   */
  async updateBatchChunkEmbeddings(items: { chunkId: string; embedding: number[] }[]): Promise<void> {
    for (const item of items) {
      await this.updateChunkEmbedding(item.chunkId, item.embedding);
    }
  }

  /**
   * Executes hybrid search combining pgvector cosine distance and full-text search.
   */
  async searchHybrid(options: HybridSearchOptions): Promise<RetrievedChunk[]> {
    const {
      query,
      embedding,
      topK = 5,
      similarityThreshold = 0.5,
      documentIds,
      documentTypes,
    } = options;

    const startTime = Date.now();
    const vectorStr = `[${embedding.join(',')}]`;

    // Extract substantive terms for lexical full-text matching
    const STOPWORDS = new Set([
      'quy', 'định', 'về', 'việc', 'vào', 'và', 'của', 'các', 'có', 'là',
      'trong', 'được', 'này', 'theo', 'tại', 'cho', 'gì', 'nào', 'đâu',
      'ở', 'bao', 'nhiêu', 'sao', 'thế', 'hãy', 'biết', 'văn', 'bản'
    ]);

    const words = query
      .toLowerCase()
      .split(/[\s,.;:!?\-—()[\]{}"']+/)
      .filter((w) => w.length >= 2 && !STOPWORDS.has(w) && /^[a-zà-ỹ0-9]+$/i.test(w));

    const orQuery = words.length > 0 ? words.slice(0, 10).join(' | ') : 'phap & luat';

    // Filter clauses
    const whereConditions: Prisma.Sql[] = [
      Prisma.sql`d."status" = 'INDEXED'`,
      Prisma.sql`c."embedding" IS NOT NULL`,
    ];

    if (documentIds && documentIds.length > 0) {
      whereConditions.push(Prisma.sql`d."id" IN (${Prisma.join(documentIds)})`);
    }

    if (documentTypes && documentTypes.length > 0) {
      whereConditions.push(
        Prisma.sql`d."documentType"::text IN (${Prisma.join(documentTypes)})`,
      );
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(whereConditions, ' AND ')}`;

    // Hybrid SQL Query with Cosine Similarity and Lexical Keyword Match
    const rawResults = await this.prisma.$queryRaw<
      Array<{
        id: string;
        documentId: string;
        documentTitle: string;
        documentNumber: string | null;
        content: string;
        article: string | null;
        clause: string | null;
        point: string | null;
        page: number | null;
        hierarchyPath: string;
        sourceUrl: string | null;
        similarity: number;
        keywordRank: number;
      }>
    >`
      SELECT
        c."id",
        d."id" AS "documentId",
        d."title" AS "documentTitle",
        d."documentNumber",
        c."content",
        c."article",
        c."clause",
        c."point",
        c."page",
        c."hierarchyPath",
        d."sourceUrl",
        ROUND((1 - (c."embedding" <=> ${vectorStr}::vector))::numeric, 4)::float AS "similarity",
        ROUND((CASE WHEN to_tsvector('simple', c."content") @@ to_tsquery('simple', ${orQuery}) THEN LEAST(1.0, ts_rank(to_tsvector('simple', c."content"), to_tsquery('simple', ${orQuery})) * 5) ELSE 0 END)::numeric, 4)::float AS "keywordRank"
      FROM "document_chunks" c
      JOIN "document_versions" v ON c."documentVersionId" = v."id"
      JOIN "documents" d ON v."documentId" = d."id"
      ${whereClause}
      ORDER BY (
        (1 - (c."embedding" <=> ${vectorStr}::vector)) * 0.6 +
        (CASE WHEN to_tsvector('simple', c."content") @@ to_tsquery('simple', ${orQuery}) THEN LEAST(1.0, ts_rank(to_tsvector('simple', c."content"), to_tsquery('simple', ${orQuery})) * 5) ELSE 0 END) * 0.4
      ) DESC
      LIMIT ${topK * 2}
    `;

    // Normalize and filter by similarity threshold
    const candidates: RetrievedChunk[] = [];

    for (const row of rawResults) {
      const semanticScore = Math.max(0, row.similarity || 0);
      const keywordScore = Math.min(1.0, row.keywordRank || 0);

      // Combined hybrid score
      const hybridScore = Number(
        (semanticScore * 0.6 + keywordScore * 0.4).toFixed(4),
      );

      // Keep if substantive keyword match OR semantic similarity meets threshold
      if (keywordScore > 0 || semanticScore >= similarityThreshold || hybridScore >= 0.35) {
        candidates.push({
          chunkId: row.id,
          documentId: row.documentId,
          documentTitle: row.documentTitle,
          documentNumber: row.documentNumber || undefined,
          content: row.content,
          article: row.article || undefined,
          clause: row.clause || undefined,
          point: row.point || undefined,
          page: row.page || undefined,
          similarity: semanticScore,
          keywordScore,
          hybridScore,
          hierarchyPath: row.hierarchyPath,
          sourceUrl: row.sourceUrl || undefined,
        });
      }
    }

    // Sort descending by hybrid score and take topK
    candidates.sort((a, b) => b.hybridScore - a.hybridScore);
    const finalResults = candidates.slice(0, topK);

    const duration = Date.now() - startTime;
    this.logger.log(
      `Hybrid vector search completed in ${duration}ms. Query: "${query}". Retrieved candidates: ${finalResults.length}/${rawResults.length}`,
    );

    return finalResults;
  }
}
