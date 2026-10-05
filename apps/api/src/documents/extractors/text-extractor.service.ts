import { Injectable, BadRequestException } from '@nestjs/common';
import { normalizeLegalText } from '@legal-rag/shared';

@Injectable()
export class TextExtractorService {
  /**
   * Normalizes raw text or markdown content.
   */
  extract(rawText: string): string {
    if (!rawText || rawText.trim().length === 0) {
      throw new BadRequestException('Nội dung văn bản không được để trống.');
    }
    return normalizeLegalText(rawText);
  }
}
