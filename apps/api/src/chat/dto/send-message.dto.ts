import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsArray, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LegalDocumentType } from '@legal-rag/shared';

export class SendMessageDto {
  @ApiProperty({
    example: 'Điều khoản nào quy định thời hạn thực hiện thông báo khi có sự cố lộ lọt dữ liệu?',
    description: 'Nội dung câu hỏi pháp lý của người dùng',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nội dung câu hỏi không được để trống' })
  content!: string;

  @ApiPropertyOptional({ description: 'Số lượng trích đoạn pháp lý tối đa', default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  topK?: number;

  @ApiPropertyOptional({ description: 'Ngưỡng tương đồng tối thiểu (0.0 đến 1.0)', default: 0.45 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  similarityThreshold?: number;

  @ApiPropertyOptional({ description: 'Lọc theo ID văn bản cụ thể', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentIds?: string[];

  @ApiPropertyOptional({
    description: 'Lọc theo loại văn bản pháp lý',
    enum: ['LAW', 'DECREE', 'CIRCULAR', 'DECISION', 'REGULATION', 'RESOLUTION', 'ORDER', 'DIRECTIVE', 'OTHER'],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(
    ['LAW', 'DECREE', 'CIRCULAR', 'DECISION', 'REGULATION', 'RESOLUTION', 'ORDER', 'DIRECTIVE', 'OTHER'],
    { each: true },
  )
  documentTypes?: LegalDocumentType[];
}
