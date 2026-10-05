import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiPropertyOptional({
    description: 'Tiêu đề phiên hỏi đáp pháp lý',
    example: 'Tra cứu quy định bảo vệ dữ liệu cá nhân',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}
