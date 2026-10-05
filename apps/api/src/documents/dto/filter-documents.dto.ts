import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LegalDocumentType, IngestionStatus } from '@legal-rag/shared';

export class FilterDocumentsDto {
  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm tiêu đề hoặc số hiệu văn bản' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Trạng thái văn bản',
    enum: ['PENDING', 'PROCESSING', 'INDEXED', 'FAILED'],
  })
  @IsOptional()
  @IsEnum(['PENDING', 'PROCESSING', 'INDEXED', 'FAILED'])
  status?: IngestionStatus;

  @ApiPropertyOptional({
    description: 'Loại văn bản',
    enum: ['LAW', 'DECREE', 'CIRCULAR', 'DECISION', 'REGULATION', 'RESOLUTION', 'ORDER', 'DIRECTIVE', 'OTHER'],
  })
  @IsOptional()
  @IsEnum(['LAW', 'DECREE', 'CIRCULAR', 'DECISION', 'REGULATION', 'RESOLUTION', 'ORDER', 'DIRECTIVE', 'OTHER'])
  documentType?: LegalDocumentType;

  @ApiPropertyOptional({ description: 'Trang hiện tại (bắt đầu từ 1)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Số lượng mục trên mỗi trang', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
