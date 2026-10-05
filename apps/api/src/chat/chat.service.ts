import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RagService } from '../rag/rag.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ragService: RagService,
  ) {}

  async createSession(userId?: string, title?: string) {
    const sessionTitle = title?.trim() || 'Phiên hỏi đáp pháp lý mới';
    return this.prisma.chatSession.create({
      data: {
        userId,
        title: sessionTitle,
      },
    });
  }

  async findAllSessions(userId?: string) {
    return this.prisma.chatSession.findMany({
      where: userId ? { userId } : {},
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });
  }

  async getSession(id: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            citations: {
              orderBy: { citationIndex: 'asc' },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Không tìm thấy phiên hỏi đáp với ID: ${id}`);
    }

    return session;
  }

  async deleteSession(id: string) {
    await this.getSession(id);
    await this.prisma.chatSession.delete({
      where: { id },
    });
    return { success: true, message: `Đã xóa phiên hỏi đáp ID: ${id}` };
  }

  async sendMessage(sessionId: string, dto: SendMessageDto, userId?: string) {
    const session = await this.getSession(sessionId);

    // 1. Persist user question message
    await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'user',
        content: dto.content.trim(),
      },
    });

    // Auto-update session title from first question if title is default
    if (session.title === 'Phiên hỏi đáp pháp lý mới') {
      const summaryTitle = dto.content.trim().slice(0, 50);
      await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { title: summaryTitle },
      });
    }

    // 2. Run Grounded Legal RAG Pipeline
    const ragResult = await this.ragService.answerQuestion(dto.content, {
      topK: dto.topK,
      similarityThreshold: dto.similarityThreshold,
      documentIds: dto.documentIds,
      documentTypes: dto.documentTypes,
    });

    // 3. Persist assistant response
    const assistantMessage = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: ragResult.answer,
        confidence: ragResult.confidence,
        insufficientContext: ragResult.insufficientContext,
        provider: ragResult.provider,
        executionTimeMs: ragResult.executionTimeMs,
      },
    });

    // 4. Persist verified citations
    for (let i = 0; i < ragResult.citations.length; i++) {
      const c = ragResult.citations[i];
      await this.prisma.retrievedCitation.create({
        data: {
          messageId: assistantMessage.id,
          chunkId: c.chunkId || undefined,
          citationIndex: i + 1,
          documentTitle: c.documentTitle,
          documentNumber: c.documentNumber,
          article: c.article,
          clause: c.clause,
          point: c.point,
          page: c.page,
          quote: c.quote,
          verified: c.verified,
          sourceUrl: c.sourceUrl,
          hierarchyPath: c.hierarchyPath,
        },
      });
    }

    // Update session timestamp
    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    // Return the enriched message with citations and retrieved sources
    const fullMessage = await this.prisma.chatMessage.findUnique({
      where: { id: assistantMessage.id },
      include: {
        citations: {
          orderBy: { citationIndex: 'asc' },
        },
      },
    });

    return {
      message: fullMessage,
      retrievedChunks: ragResult.retrievedChunks,
      disclaimer: ragResult.disclaimer,
    };
  }
}
