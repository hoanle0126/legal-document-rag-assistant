import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from '../ai/ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  llmProvider?: string;

  @IsOptional()
  @IsString()
  embeddingProvider?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  defaultTopK?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  defaultSimilarityThreshold?: number;
}

@ApiTags('Settings - Cấu hình Hệ thống')
@Controller('settings')
export class SettingsController {
  private runtimeConfig = {
    defaultTopK: 5,
    defaultSimilarityThreshold: 0.45,
    chunkSize: 600,
    chunkOverlap: 100,
  };

  constructor(private readonly aiService: AiService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy cấu hình hiện tại của hệ thống RAG và các AI Provider' })
  @ApiResponse({ status: 200, description: 'Thông tin cấu hình' })
  getSettings() {
    const aiInfo = this.aiService.getCurrentProviderInfo();
    return {
      ...this.runtimeConfig,
      ...aiInfo,
    };
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật cấu hình bộ suy luận AI và tham số truy hồi' })
  @ApiResponse({ status: 200, description: 'Cấu hình đã được cập nhật thành công' })
  updateSettings(@Body() dto: UpdateSettingsDto) {
    if (dto.llmProvider || dto.embeddingProvider) {
      this.aiService.setProviders(dto.llmProvider, dto.embeddingProvider);
    }
    if (dto.defaultTopK !== undefined) {
      this.runtimeConfig.defaultTopK = dto.defaultTopK;
    }
    if (dto.defaultSimilarityThreshold !== undefined) {
      this.runtimeConfig.defaultSimilarityThreshold = dto.defaultSimilarityThreshold;
    }

    return this.getSettings();
  }
}
