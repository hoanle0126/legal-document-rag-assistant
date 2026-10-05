import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { LegalParserService } from './legal-parser/legal-parser.service';
import { LegalChunkerService } from './chunker/legal-chunker.service';
import { VectorService } from '../vector/vector.service';
import { AiService } from '../ai/ai.service';
import {
  LegalDocumentType,
  IngestionSourceType,
  ParsedLegalNode,
} from '@legal-rag/shared';
import * as crypto from 'crypto';
import { FilterDocumentsDto } from './dto/filter-documents.dto';
import { Prisma } from '@prisma/client';

export interface IngestionInput {
  title?: string;
  content: string;
  sourceType: IngestionSourceType;
  sourceUrl?: string;
  sourceFileName?: string;
  sourceMimeType?: string;
  documentNumber?: string;
  documentType?: LegalDocumentType;
  issuingAuthority?: string;
  publishedAt?: string;
  effectiveAt?: string;
  pageCount?: number;
  pageMap?: { page: number; startIndex: number; endIndex: number }[];
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly parser: LegalParserService,
    private readonly chunker: LegalChunkerService,
    private readonly vectorService: VectorService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Complete Document Ingestion Pipeline:
   * Raw Content -> Checksum/Deduplication -> Legal Parsing -> Hierarchy Storage -> Legal Chunking -> Vector Embedding -> Indexing
   */
  async ingestDocument(input: IngestionInput) {
    const startTime = Date.now();
    const rawContent = input.content.trim();

    if (!rawContent || rawContent.length < 20) {
      throw new BadRequestException('Nội dung văn bản quá ngắn hoặc không hợp lệ.');
    }

    // 1. Calculate SHA-256 Checksum for duplicate prevention
    const checksum = crypto.createHash('sha256').update(rawContent).digest('hex');

    const existingVersion = await this.prisma.documentVersion.findFirst({
      where: { checksum },
      include: { document: true },
    });

    if (existingVersion) {
      this.logger.log(`Phát hiện văn bản trùng lặp: Checksum ${checksum} đã tồn tại trong văn bản ID: ${existingVersion.documentId}`);
      return {
        document: existingVersion.document,
        isDuplicate: true,
        message: 'Văn bản có nội dung tương tự đã tồn tại trong hệ thống (trùng khớp mã băm SHA-256).',
      };
    }

    // 2. Parse legal document hierarchy
    const parsed = this.parser.parse(rawContent, {
      title: input.title,
      documentNumber: input.documentNumber,
      documentType: input.documentType,
      issuingAuthority: input.issuingAuthority,
      publishedAt: input.publishedAt,
      effectiveAt: input.effectiveAt,
      pageMap: input.pageMap,
    });

    const finalTitle = input.title || parsed.title;
    const finalDocNumber = input.documentNumber || parsed.documentNumber;
    const finalDocType = (input.documentType || parsed.documentType || 'LAW') as LegalDocumentType;
    const finalAuthority = input.issuingAuthority || parsed.issuingAuthority;

    // 3. Create Document and IngestionJob inside transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          title: finalTitle,
          documentNumber: finalDocNumber,
          documentType: finalDocType,
          issuingAuthority: finalAuthority,
          sourceUrl: input.sourceUrl,
          publishedAt: input.publishedAt ? new Date(input.publishedAt) : undefined,
          effectiveAt: input.effectiveAt ? new Date(input.effectiveAt) : undefined,
          status: 'PROCESSING',
          summary: parsed.summary,
        },
      });

      const version = await tx.documentVersion.create({
        data: {
          documentId: doc.id,
          version: 1,
          checksum,
          rawText: rawContent,
          sourceFileName: input.sourceFileName,
          sourceMimeType: input.sourceMimeType,
          sourceType: input.sourceType,
          pageCount: input.pageCount || 1,
        },
      });

      const job = await tx.ingestionJob.create({
        data: {
          documentId: doc.id,
          status: 'PROCESSING',
          sourceType: input.sourceType,
          sourceUrl: input.sourceUrl,
          sourceFileName: input.sourceFileName,
          startedAt: new Date(),
        },
      });

      return { doc, version, job };
    });

    try {
      // 4. Save hierarchical legal nodes into database
      const nodeMap = new Map<ParsedLegalNode, string>();
      await this.saveLegalNodesRecursively(parsed.rootNodes, result.version.id, null, nodeMap);

      // 5. Chunk the document with legal-aware boundaries
      const chunksData = this.chunker.chunkDocument(
        parsed.rootNodes,
        {
          documentId: result.doc.id,
          documentTitle: result.doc.title,
          documentNumber: result.doc.documentNumber || undefined,
          documentType: result.doc.documentType,
          issuingAuthority: result.doc.issuingAuthority || undefined,
          sourceUrl: result.doc.sourceUrl || undefined,
          versionId: result.version.id,
        },
        { maxTokens: 600, overlapTokens: 100 },
      );

      this.logger.log(`Tạo được ${chunksData.length} phân đoạn pháp lý (chunks) cho văn bản "${result.doc.title}".`);

      // 6. Generate embeddings using active embedding provider
      const embeddingProvider = this.aiService.getEmbeddingProvider();
      const chunkTexts = chunksData.map((c) => c.content);
      const embeddings = await embeddingProvider.embedDocuments(chunkTexts);

      // 7. Store document chunks & embeddings in PostgreSQL pgvector
      for (let i = 0; i < chunksData.length; i++) {
        const c = chunksData[i];
        const emb = embeddings[i];

        const createdChunk = await this.prisma.documentChunk.create({
          data: {
            documentVersionId: result.version.id,
            legalNodeId: c.legalNodeId,
            content: c.content,
            tokenCount: c.tokenCount,
            article: c.article,
            clause: c.clause,
            point: c.point,
            page: c.page,
            hierarchyPath: c.hierarchyPath,
            metadata: c.metadata as any,
          },
        });

        // Update pgvector column with vector cast
        if (emb && emb.length > 0) {
          await this.vectorService.updateChunkEmbedding(createdChunk.id, emb);
        }
      }

      const processingTimeMs = Date.now() - startTime;

      // 8. Update Document & IngestionJob to INDEXED
      await this.prisma.$transaction([
        this.prisma.document.update({
          where: { id: result.doc.id },
          data: { status: 'INDEXED' },
        }),
        this.prisma.ingestionJob.update({
          where: { id: result.job.id },
          data: {
            status: 'INDEXED',
            chunksCount: chunksData.length,
            processingTimeMs,
            completedAt: new Date(),
          },
        }),
      ]);

      this.logger.log(`Nạp và lập chỉ mục thành công văn bản ${result.doc.id} trong ${processingTimeMs}ms.`);

      return {
        document: await this.findOne(result.doc.id),
        chunksCount: chunksData.length,
        processingTimeMs,
        isDuplicate: false,
      };
    } catch (err: any) {
      this.logger.error(`Lỗi trong quá trình nạp văn bản: ${err.message}`, err.stack);
      await this.prisma.document.update({
        where: { id: result.doc.id },
        data: { status: 'FAILED' },
      });
      await this.prisma.ingestionJob.update({
        where: { id: result.job.id },
        data: {
          status: 'FAILED',
          errorMessage: err.message,
          completedAt: new Date(),
        },
      });
      throw new BadRequestException(`Xử lý nạp văn bản thất bại: ${err.message}`);
    }
  }

  private async saveLegalNodesRecursively(
    nodes: ParsedLegalNode[],
    versionId: string,
    parentId: string | null,
    nodeMap: Map<ParsedLegalNode, string>,
  ) {
    for (const node of nodes) {
      const created = await this.prisma.legalNode.create({
        data: {
          documentVersionId: versionId,
          parentId,
          type: node.type,
          number: node.number,
          title: node.title,
          content: node.content,
          originalText: node.originalText,
          hierarchyPath: node.hierarchyPath,
          page: node.page,
          orderIndex: node.orderIndex,
        },
      });

      node.id = created.id;
      nodeMap.set(node, created.id);

      if (node.children && node.children.length > 0) {
        await this.saveLegalNodesRecursively(node.children, versionId, created.id, nodeMap);
      }
    }
  }

  async findAll(filter: FilterDocumentsDto) {
    const { search, status, documentType, page = 1, limit = 10 } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.DocumentWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (documentType) {
      where.documentType = documentType;
    }

    if (search && search.trim().length > 0) {
      const query = search.trim();
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { documentNumber: { contains: query, mode: 'insensitive' } },
        { issuingAuthority: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [total, documents] = await Promise.all([
      this.prisma.document.count({ where }),
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              versions: true,
              ingestionJobs: true,
            },
          },
          versions: {
            take: 1,
            orderBy: { version: 'desc' },
            select: {
              id: true,
              version: true,
              sourceType: true,
              pageCount: true,
              createdAt: true,
              _count: {
                select: {
                  chunks: true,
                  legalNodes: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      data: documents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          include: {
            _count: {
              select: {
                chunks: true,
                legalNodes: true,
              },
            },
          },
        },
        ingestionJobs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!doc) {
      throw new NotFoundException(`Không tìm thấy văn bản với ID: ${id}`);
    }

    return doc;
  }

  async getDocumentStructure(id: string) {
    const doc = await this.findOne(id);
    const latestVersion = doc.versions[0];
    if (!latestVersion) {
      return { rootNodes: [] };
    }

    // Load all nodes for this version
    const allNodes = await this.prisma.legalNode.findMany({
      where: { documentVersionId: latestVersion.id },
      orderBy: { orderIndex: 'asc' },
    });

    // Reconstruct tree structure
    const nodeMap = new Map<string, any>();
    const rootNodes: any[] = [];

    for (const node of allNodes) {
      nodeMap.set(node.id, { ...node, children: [] });
    }

    for (const node of allNodes) {
      const mapped = nodeMap.get(node.id);
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId).children.push(mapped);
      } else {
        rootNodes.push(mapped);
      }
    }

    return {
      documentId: doc.id,
      title: doc.title,
      version: latestVersion.version,
      rootNodes,
    };
  }

  async getVersions(id: string) {
    await this.findOne(id);
    return this.prisma.documentVersion.findMany({
      where: { documentId: id },
      orderBy: { version: 'desc' },
      include: {
        _count: {
          select: { chunks: true, legalNodes: true },
        },
      },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.prisma.document.delete({
      where: { id },
    });
    return { success: true, message: `Đã xóa văn bản ID: ${id}` };
  }

  async reindex(id: string) {
    const doc = await this.findOne(id);
    const latestVersion = doc.versions[0];

    if (!latestVersion) {
      throw new BadRequestException('Văn bản không có phiên bản nào để lập chỉ mục lại.');
    }

    // Delete existing nodes and chunks for this version
    await this.prisma.$transaction([
      this.prisma.documentChunk.deleteMany({
        where: { documentVersionId: latestVersion.id },
      }),
      this.prisma.legalNode.deleteMany({
        where: { documentVersionId: latestVersion.id },
      }),
      this.prisma.document.update({
        where: { id },
        data: { status: 'PROCESSING' },
      }),
    ]);

    // Re-parse and re-chunk
    const parsed = this.parser.parse(latestVersion.rawText, {
      title: doc.title,
      documentNumber: doc.documentNumber || undefined,
      documentType: doc.documentType,
      issuingAuthority: doc.issuingAuthority || undefined,
    });

    const nodeMap = new Map<ParsedLegalNode, string>();
    await this.saveLegalNodesRecursively(parsed.rootNodes, latestVersion.id, null, nodeMap);

    const chunksData = this.chunker.chunkDocument(parsed.rootNodes, {
      documentId: doc.id,
      documentTitle: doc.title,
      documentNumber: doc.documentNumber || undefined,
      documentType: doc.documentType,
      issuingAuthority: doc.issuingAuthority || undefined,
      sourceUrl: doc.sourceUrl || undefined,
      versionId: latestVersion.id,
    });

    const embeddingProvider = this.aiService.getEmbeddingProvider();
    const embeddings = await embeddingProvider.embedDocuments(chunksData.map((c) => c.content));

    for (let i = 0; i < chunksData.length; i++) {
      const c = chunksData[i];
      const emb = embeddings[i];
      const chunk = await this.prisma.documentChunk.create({
        data: {
          documentVersionId: latestVersion.id,
          legalNodeId: c.legalNodeId,
          content: c.content,
          tokenCount: c.tokenCount,
          article: c.article,
          clause: c.clause,
          point: c.point,
          page: c.page,
          hierarchyPath: c.hierarchyPath,
          metadata: c.metadata as any,
        },
      });

      if (emb && emb.length > 0) {
        await this.vectorService.updateChunkEmbedding(chunk.id, emb);
      }
    }

    await this.prisma.document.update({
      where: { id },
      data: { status: 'INDEXED' },
    });

    return {
      success: true,
      message: `Đã lập chỉ mục lại thành công. Tạo được ${chunksData.length} chunks.`,
      chunksCount: chunksData.length,
    };
  }
}
