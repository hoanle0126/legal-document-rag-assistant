import { Injectable, Logger } from '@nestjs/common';
import {
  ParsedLegalNode,
  DocumentChunkData,
} from '@legal-rag/shared';

export interface ChunkerOptions {
  maxTokens?: number; // Target chunk size (default: 600)
  overlapTokens?: number; // Overlap for large nodes (default: 100)
}

@Injectable()
export class LegalChunkerService {
  private readonly logger = new Logger(LegalChunkerService.name);

  /**
   * Generates legal-aware chunks from parsed hierarchy nodes.
   * Prioritizes Article and Clause boundaries, with sliding window fallback for long texts.
   */
  chunkDocument(
    rootNodes: ParsedLegalNode[],
    docMeta: {
      documentId: string;
      documentTitle: string;
      documentNumber?: string;
      documentType?: string;
      issuingAuthority?: string;
      sourceUrl?: string;
      versionId?: string;
    },
    options: ChunkerOptions = {},
  ): DocumentChunkData[] {
    const maxTokens = options.maxTokens || 600;
    const overlapTokens = options.overlapTokens || 100;
    const chunks: DocumentChunkData[] = [];

    const processNode = (node: ParsedLegalNode, contextBreadcrumb: string[]) => {
      const currentPath = node.hierarchyPath;
      const pathParts = [...contextBreadcrumb, node.title || node.number || node.type];

      // If node is an Article
      if (node.type === 'ARTICLE') {
        const articleNum = node.number;

        // If the article has child clauses, process each clause as an independent legal chunk
        if (node.children && node.children.length > 0) {
          for (const child of node.children) {
            if (child.type === 'CLAUSE') {
              this.createChunksForClause(child, node, docMeta, maxTokens, overlapTokens, chunks);
            } else {
              processNode(child, pathParts);
            }
          }
        } else {
          // Article without child clauses - chunk directly
          this.createChunksForArticle(node, docMeta, maxTokens, overlapTokens, chunks);
        }
        return;
      }

      // If node is a Clause (reached without Article parent or top-level)
      if (node.type === 'CLAUSE') {
        this.createChunksForClause(node, null, docMeta, maxTokens, overlapTokens, chunks);
        return;
      }

      // For Part / Chapter / Section containers: recurse to children
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          processNode(child, pathParts);
        }
        return;
      }

      // Unstructured or paragraph content (e.g. preamble)
      if (node.content && node.content.trim().length > 0) {
        this.createFallbackChunks(node, docMeta, maxTokens, overlapTokens, chunks);
      }
    };

    for (const root of rootNodes) {
      processNode(root, []);
    }

    return chunks;
  }

  private createChunksForClause(
    clauseNode: ParsedLegalNode,
    articleNode: ParsedLegalNode | null,
    docMeta: any,
    maxTokens: number,
    overlapTokens: number,
    outChunks: DocumentChunkData[],
  ) {
    const articleNum = articleNode?.number;
    const clauseNum = clauseNode.number;
    const hierarchyPath = clauseNode.hierarchyPath;

    // Combine any points inside this clause
    let fullClauseText = clauseNode.content.trim();
    if (clauseNode.children && clauseNode.children.length > 0) {
      const pointsText = clauseNode.children
        .map((c) => c.content.trim())
        .filter(Boolean)
        .join('\n');
      if (pointsText && !fullClauseText.includes(pointsText)) {
        fullClauseText += '\n' + pointsText;
      }
    }

    const estimatedTokens = this.estimateTokens(fullClauseText);

    if (estimatedTokens <= maxTokens) {
      outChunks.push(
        this.buildChunk({
          content: fullClauseText,
          nodeId: clauseNode.id,
          article: articleNum,
          clause: clauseNum,
          page: clauseNode.page || articleNode?.page,
          hierarchyPath,
          docMeta,
        }),
      );
    } else {
      // Clause is too long, split with overlap while preserving legal reference
      const segments = this.splitIntoSegments(fullClauseText, maxTokens, overlapTokens);
      for (let i = 0; i < segments.length; i++) {
        outChunks.push(
          this.buildChunk({
            content: segments[i],
            nodeId: clauseNode.id,
            article: articleNum,
            clause: clauseNum,
            page: clauseNode.page || articleNode?.page,
            hierarchyPath: `${hierarchyPath} (Phần ${i + 1}/${segments.length})`,
            docMeta,
          }),
        );
      }
    }
  }

  private createChunksForArticle(
    articleNode: ParsedLegalNode,
    docMeta: any,
    maxTokens: number,
    overlapTokens: number,
    outChunks: DocumentChunkData[],
  ) {
    const articleNum = articleNode.number;
    const hierarchyPath = articleNode.hierarchyPath;
    const text = articleNode.content.trim();
    const estimatedTokens = this.estimateTokens(text);

    if (estimatedTokens <= maxTokens) {
      outChunks.push(
        this.buildChunk({
          content: text,
          nodeId: articleNode.id,
          article: articleNum,
          page: articleNode.page,
          hierarchyPath,
          docMeta,
        }),
      );
    } else {
      const segments = this.splitIntoSegments(text, maxTokens, overlapTokens);
      for (let i = 0; i < segments.length; i++) {
        outChunks.push(
          this.buildChunk({
            content: segments[i],
            nodeId: articleNode.id,
            article: articleNum,
            page: articleNode.page,
            hierarchyPath: `${hierarchyPath} (Phần ${i + 1}/${segments.length})`,
            docMeta,
          }),
        );
      }
    }
  }

  private createFallbackChunks(
    node: ParsedLegalNode,
    docMeta: any,
    maxTokens: number,
    overlapTokens: number,
    outChunks: DocumentChunkData[],
  ) {
    const text = node.content.trim();
    const segments = this.splitIntoSegments(text, maxTokens, overlapTokens);
    for (const segment of segments) {
      outChunks.push(
        this.buildChunk({
          content: segment,
          nodeId: node.id,
          page: node.page,
          hierarchyPath: node.hierarchyPath,
          docMeta,
        }),
      );
    }
  }

  private buildChunk(params: {
    content: string;
    nodeId?: string;
    article?: string;
    clause?: string;
    point?: string;
    page?: number;
    hierarchyPath: string;
    docMeta: any;
  }): DocumentChunkData {
    const tokenCount = this.estimateTokens(params.content);
    return {
      legalNodeId: params.nodeId,
      documentVersionId: params.docMeta.versionId,
      content: params.content,
      tokenCount,
      article: params.article,
      clause: params.clause,
      point: params.point,
      page: params.page,
      hierarchyPath: params.hierarchyPath,
      metadata: {
        documentId: params.docMeta.documentId,
        documentTitle: params.docMeta.documentTitle,
        documentNumber: params.docMeta.documentNumber,
        documentType: params.docMeta.documentType,
        issuingAuthority: params.docMeta.issuingAuthority,
        sourceUrl: params.docMeta.sourceUrl,
        page: params.page,
        article: params.article,
        clause: params.clause,
        point: params.point,
        hierarchyPath: params.hierarchyPath,
      },
    };
  }

  /**
   * Splits text on paragraph or sentence boundaries respecting max token limit.
   */
  private splitIntoSegments(text: string, maxTokens: number, overlapTokens: number): string[] {
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const segments: string[] = [];
    let currentSegment = '';

    for (const para of paragraphs) {
      const testSegment = currentSegment ? `${currentSegment}\n\n${para}` : para;
      if (this.estimateTokens(testSegment) <= maxTokens) {
        currentSegment = testSegment;
      } else {
        if (currentSegment) {
          segments.push(currentSegment);
          // Apply overlap from end of currentSegment
          const words = currentSegment.split(' ');
          const overlapWords = words.slice(-Math.floor(overlapTokens / 1.3)).join(' ');
          currentSegment = overlapWords ? `${overlapWords}\n\n${para}` : para;
        } else {
          // Paragraph itself is larger than maxTokens: split by sentences
          const sentenceSegments = this.splitBySentences(para, maxTokens, overlapTokens);
          segments.push(...sentenceSegments);
          currentSegment = '';
        }
      }
    }

    if (currentSegment && currentSegment.trim().length > 0) {
      segments.push(currentSegment);
    }

    return segments.length > 0 ? segments : [text];
  }

  private splitBySentences(para: string, maxTokens: number, overlapTokens: number): string[] {
    const sentences = para.split(/(?<=[.!?])\s+/);
    const results: string[] = [];
    let current = '';

    for (const sentence of sentences) {
      const test = current ? `${current} ${sentence}` : sentence;
      if (this.estimateTokens(test) <= maxTokens) {
        current = test;
      } else {
        if (current) results.push(current);
        current = sentence;
      }
    }
    if (current) results.push(current);
    return results;
  }

  private estimateTokens(text: string): number {
    if (!text) return 0;
    // For Vietnamese / English mixed legal text, words / 0.75 or chars / 3.8
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.round(words * 1.3));
  }
}
