import { Injectable, Logger } from '@nestjs/common';
import {
  LlmProvider,
  LlmGenerationOptions,
  StructuredLlmResponse,
} from '../interfaces/ai-provider.interface';

@Injectable()
export class MockLlmProvider implements LlmProvider {
  readonly name = 'mock-llm';
  private readonly logger = new Logger(MockLlmProvider.name);

  // Hook for testing malicious or fake citations
  public injectedFakeCitation: boolean = false;

  async generateGroundedAnswer(options: LlmGenerationOptions): Promise<StructuredLlmResponse> {
    const { userPrompt } = options;

    // Parse question and context chunks from prompt
    const questionMatch = userPrompt.match(/CÂU HỎI CỦA NGƯỜI DÙNG:\s*([\s\S]*?)(?:\n\n|\n---|$)/i);
    const question = questionMatch ? questionMatch[1].trim() : userPrompt;

    // Parse context items: e.g. [CĂN CỨ ID: chunk-xxx] (Văn bản: ..., Số: ..., Điều: ..., Khoản: ...)
    const chunkRegex =
      /\[CĂN CỨ ID:\s*([^\]]+)\]\s*\(([^)]*)\)\s*\n([\s\S]*?)(?=(?:\[CĂN CỨ ID:|=== KẾT THÚC DỮ LIỆU CĂN CỨ PHÁP LÝ ===|$))/gi;

    const parsedChunks: Array<{
      id: string;
      docTitle: string;
      documentNumber?: string;
      article?: string;
      clause?: string;
      page?: number;
      text: string;
    }> = [];

    let match: RegExpExecArray | null;
    while ((match = chunkRegex.exec(userPrompt)) !== null) {
      const id = match[1]?.trim();
      const metaStr = match[2] || '';
      const text = match[3]?.replace(/=== KẾT THÚC DỮ LIỆU CĂN CỨ PHÁP LÝ ===[\s\S]*/i, '').trim() || '';

      const docTitleMatch = metaStr.match(/Văn bản:\s*([^,]+)/i);
      const docNumMatch = metaStr.match(/Số:\s*([^,]+)/i);
      const articleMatch = metaStr.match(/Điều:\s*([^,]+)/i);
      const clauseMatch = metaStr.match(/Khoản:\s*([^,]+)/i);
      const pageMatch = metaStr.match(/Trang:\s*(\d+)/i);

      parsedChunks.push({
        id,
        docTitle: docTitleMatch ? docTitleMatch[1].trim() : 'Văn bản quy phạm',
        documentNumber: docNumMatch ? docNumMatch[1].trim() : undefined,
        article: articleMatch ? articleMatch[1].trim() : undefined,
        clause: clauseMatch ? clauseMatch[1].trim() : undefined,
        page: pageMatch ? parseInt(pageMatch[1], 10) : undefined,
        text,
      });
    }

    if (parsedChunks.length === 0) {
      return {
        answer:
          'Chưa tìm thấy đủ căn cứ pháp lý trong các tài liệu hiện có trong hệ thống để đưa ra kết luận chắc chắn. Vui lòng bổ sung thêm văn bản liên quan.',
        confidence: 'low',
        insufficientContext: true,
        citations: [],
        providerName: this.name,
      };
    }

    // Stopword filter for Vietnamese
    const STOPWORDS = new Set([
      'quy', 'định', 'về', 'việc', 'vào', 'và', 'của', 'các', 'có', 'là',
      'trong', 'được', 'này', 'theo', 'tại', 'cho', 'gì', 'nào', 'đâu',
      'ở', 'bao', 'nhiêu', 'sao', 'thế', 'hãy', 'biết', 'văn', 'bản', 'không'
    ]);

    // Match question keywords against retrieved chunk content
    const qLower = question.toLowerCase();
    const keywords = qLower
      .split(/[\s,.;:!?\-—()[\]{}"']+/)
      .filter((k) => k.length >= 2 && !STOPWORDS.has(k));

    let bestChunk = parsedChunks[0];
    let maxMatch = 0;

    for (const chunk of parsedChunks) {
      const textLower = chunk.text.toLowerCase();
      let matchCount = 0;
      for (const kw of keywords) {
        if (textLower.includes(kw)) matchCount++;
      }
      if (matchCount > maxMatch) {
        maxMatch = matchCount;
        bestChunk = chunk;
      }
    }

    // If not enough substantive topic keywords matched, context does not answer the question
    const isWeakMatch =
      keywords.length === 0 ||
      (keywords.length >= 3 && maxMatch < 2) ||
      (keywords.length >= 5 && maxMatch / keywords.length < 0.25) ||
      maxMatch === 0;

    if (isWeakMatch) {
      return {
        answer:
          'Chưa tìm thấy đủ căn cứ pháp lý trong các tài liệu hiện có trong hệ thống để đưa ra kết luận chắc chắn. Vui lòng bổ sung thêm văn bản liên quan.',
        confidence: 'low',
        insufficientContext: true,
        citations: [],
        providerName: this.name,
      };
    }

    // Generate grounded response from best chunk
    const excerpt = bestChunk.text.slice(0, 300).trim();
    const articleInfo = bestChunk.article ? `${bestChunk.article}` : '';
    const clauseInfo = bestChunk.clause ? `, ${bestChunk.clause}` : '';

    const answer =
      `Căn cứ theo quy định tại ${bestChunk.docTitle}${articleInfo ? ' (' + articleInfo + clauseInfo + ')' : ''}: [1]\n\n` +
      `Quy định cụ thể nêu rõ:\n"${excerpt}"\n\n` +
      `Theo đó, đối tượng liên quan có trách nhiệm tuân thủ đầy đủ các điều kiện và trình tự thủ tục được nêu tại văn bản quy phạm này.`;

    const citations = [
      {
        citationId: bestChunk.id,
        documentId: bestChunk.id.split('_')[0] || 'doc-1',
        documentTitle: bestChunk.docTitle,
        article: bestChunk.article,
        clause: bestChunk.clause,
        page: bestChunk.page,
        quote: excerpt,
      },
    ];

    // If test flag is active, inject a fake citation that points to a non-existent chunk ID
    if (this.injectedFakeCitation) {
      citations.push({
        citationId: 'fake-chunk-id-never-retrieved-999',
        documentId: 'fake-doc-id',
        documentTitle: 'Văn bản giả mạo không tồn tại',
        article: 'Điều 999',
        clause: 'Khoản 9',
        page: undefined,
        quote: 'Nội dung trích dẫn bịa đặt hoàn toàn không có trong cơ sở dữ liệu.',
      });
    }

    return {
      answer,
      confidence: 'high',
      insufficientContext: false,
      citations,
      providerName: this.name,
    };
  }
}
