import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LegalDocumentType } from '@legal-rag/shared';

export class IngestTextDto {
  @ApiProperty({
    example: 'Nghị định số 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân',
    description: 'Tiêu đề văn bản',
  })
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề văn bản không được để trống' })
  title!: string;

  @ApiProperty({
    example: 'Chương I: QUY ĐỊNH CHUNG\n\nĐiều 1. Phạm vi điều chỉnh\n1. Nghị định này quy định về...',
    description: 'Toàn văn nội dung pháp lý',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nội dung văn bản không được để trống' })
  content!: string;

  @ApiPropertyOptional({ description: 'Số hiệu văn bản', example: '13/2023/NĐ-CP' })
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @ApiPropertyOptional({
    description: 'Loại văn bản',
    enum: ['LAW', 'DECREE', 'CIRCULAR', 'DECISION', 'REGULATION', 'RESOLUTION', 'ORDER', 'DIRECTIVE', 'OTHER'],
  })
  @IsOptional()
  @IsEnum(['LAW', 'DECREE', 'CIRCULAR', 'DECISION', 'REGULATION', 'RESOLUTION', 'ORDER', 'DIRECTIVE', 'OTHER'])
  documentType?: LegalDocumentType;

  @ApiPropertyOptional({ description: 'Cơ quan ban hành', example: 'Chính phủ' })
  @IsOptional()
  @IsString()
  issuingAuthority?: string;

  @ApiPropertyOptional({ description: 'Ngày ban hành (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  publishedAt?: string;

  @ApiPropertyOptional({ description: 'Ngày có hiệu lực (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  effectiveAt?: string;
}
