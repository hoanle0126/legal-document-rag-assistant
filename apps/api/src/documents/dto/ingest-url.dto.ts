import { IsString, IsNotEmpty, IsUrl, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LegalDocumentType } from '@legal-rag/shared';

export class IngestUrlDto {
  @ApiProperty({
    example: 'https://thuvienphapluat.vn/van-ban/Cong-nghe-thong-tin/Nghi-dinh-13-2023-ND-CP.aspx',
    description: 'Địa chỉ URL công khai của văn bản quy phạm pháp luật',
  })
  @IsString()
  @IsNotEmpty({ message: 'URL không được để trống' })
  url!: string;

  @ApiPropertyOptional({ description: 'Tiêu đề ghi đè (nếu muốn đặt thủ công)' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Số hiệu văn bản (ví dụ: 13/2023/NĐ-CP)' })
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

  @ApiPropertyOptional({ description: 'Cơ quan ban hành' })
  @IsOptional()
  @IsString()
  issuingAuthority?: string;
}
