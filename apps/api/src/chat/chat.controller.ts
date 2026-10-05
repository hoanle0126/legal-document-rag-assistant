import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('Chat - Trợ lý Hỏi đáp Pháp lý')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Khởi tạo một phiên hỏi đáp pháp lý mới' })
  @ApiResponse({ status: 201, description: 'Phiên hỏi đáp được tạo thành công' })
  async createSession(@Body() dto: CreateSessionDto, @Req() req: any) {
    const userId = req.user?.id;
    return this.chatService.createSession(userId, dto.title);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Lấy danh sách các phiên hỏi đáp gần đây' })
  @ApiResponse({ status: 200, description: 'Danh sách các phiên hỏi đáp' })
  async findAllSessions(@Req() req: any) {
    const userId = req.user?.id;
    return this.chatService.findAllSessions(userId);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Lấy chi tiết phiên hỏi đáp cùng toàn bộ lịch sử tin nhắn và trích dẫn' })
  @ApiResponse({ status: 200, description: 'Chi tiết phiên hỏi đáp' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phiên' })
  async getSession(@Param('id') id: string) {
    return this.chatService.getSession(id);
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Xóa một phiên hỏi đáp và toàn bộ tin nhắn liên quan' })
  async deleteSession(@Param('id') id: string) {
    return this.chatService.deleteSession(id);
  }

  @Post('sessions/:id/messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gửi câu hỏi pháp lý vào phiên hỏi đáp và nhận câu trả lời có trích dẫn' })
  @ApiResponse({ status: 200, description: 'Phản hồi từ Trợ lý Pháp lý kèm trích dẫn đã xác minh' })
  async sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.chatService.sendMessage(id, dto, userId);
  }
}
