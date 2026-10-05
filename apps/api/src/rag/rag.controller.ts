import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RagService } from './rag.service';
import { RagQueryDto } from './dto/rag-query.dto';

@ApiTags('RAG - Hỏi đáp Pháp lý')
@Controller('rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Truy vấn RAG văn bản pháp luật có trích dẫn nguồn xác thực',
    description:
      'Nhận câu hỏi pháp lý từ người dùng, thực hiện tìm kiếm kết hợp (hybrid search) ngữ nghĩa vector và từ khóa, đối chiếu context và tạo câu trả lời với trích dẫn chính xác.',
  })
  @ApiResponse({ status: 200, description: 'Kết quả giải đáp pháp lý kèm trích dẫn.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ.' })
  async query(@Body() dto: RagQueryDto) {
    return this.ragService.answerQuestion(dto.question, {
      topK: dto.topK,
      similarityThreshold: dto.similarityThreshold,
      documentIds: dto.documentIds,
      documentTypes: dto.documentTypes,
    });
  }
}
