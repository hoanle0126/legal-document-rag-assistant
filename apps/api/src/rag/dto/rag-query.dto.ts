import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsArray, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LegalDocumentType } from '@legal-rag/shared';

export class RagQueryDto {
  @ApiProperty({
    description: 'Câu hỏi pháp lý cần tra cứu hoặc giải đáp',
    example: 'Doanh nghiệp cần thực hiện nghĩa vụ gì theo quy định về hồ sơ này?',
  })
  @IsString()
  @IsNotEmpty({ message: 'Câu hỏi pháp lý không được để trống' })
  question!: string;

  @ApiPropertyOptional({
    description: 'Số lượng trích đoạn pháp lý tối đa cần truy hồi',
    default: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  topK?: number;

  @ApiPropertyOptional({
    description: 'Ngưỡng tương đồng tối thiểu (0.0 đến 1.0)',
    default: 0.45,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  similarityThreshold?: number;

  @ApiPropertyOptional({
    description: 'Lọc theo danh sách ID văn bản cụ thể',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentIds?: string[];

  @ApiPropertyOptional({
    description: 'Lọc theo loại văn bản quy phạm pháp luật',
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
