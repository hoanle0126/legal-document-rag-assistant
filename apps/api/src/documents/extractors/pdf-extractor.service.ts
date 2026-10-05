import { Injectable, BadRequestException, Logger } from '@nestjs/common';
const pdfParse = require('pdf-parse');

export interface ExtractedPdfResult {
  text: string;
  pageCount: number;
  pageMap: { page: number; startIndex: number; endIndex: number }[];
  isScannedOrEmpty: boolean;
}

@Injectable()
export class PdfExtractorService {
  private readonly logger = new Logger(PdfExtractorService.name);

  /**
   * Extracts text and page metadata from a PDF buffer.
   * Detects image-only/scanned PDFs that lack text layers and informs user OCR is required.
   */
  async extractText(buffer: Buffer): Promise<ExtractedPdfResult> {
    try {
      const pageTexts: { page: number; text: string }[] = [];

      const renderPage = (pageData: any) => {
        return pageData.getTextContent().then((textContent: any) => {
          let lastY: number | null = null;
          let text = '';
          for (const item of textContent.items) {
            if (lastY === item.transform[5] || lastY === null) {
              text += item.str;
            } else {
              text += '\n' + item.str;
            }
            lastY = item.transform[5];
          }
          pageTexts.push({
            page: pageData.pageNumber || pageData.pageIndex + 1,
            text,
          });
          return text;
        });
      };

      const options = {
        pagerender: renderPage,
      };

      const data = await pdfParse(buffer, options);
      const pageCount = data.numpages || 1;
      const fullText = data.text || '';

      // Check if PDF has no usable text
      const cleanChars = fullText.replace(/\s+/g, '');
      const avgCharsPerPage = pageCount > 0 ? cleanChars.length / pageCount : 0;

      if (cleanChars.length < 50 || avgCharsPerPage < 15) {
        this.logger.warn(`PDF appears to be scanned or textless. PageCount: ${pageCount}, CharCount: ${cleanChars.length}`);
        throw new BadRequestException(
          'Tài liệu PDF được tải lên dường như là bản scan (dạng ảnh) và không chứa lớp văn bản kỹ thuật số. Vui lòng sử dụng bản PDF có văn bản hoặc thực hiện OCR trước khi tải lên.',
        );
      }

      // Build character-offset page map
      const pageMap: { page: number; startIndex: number; endIndex: number }[] = [];
      let currentOffset = 0;

      // Sort pageTexts by page number
      pageTexts.sort((a, b) => a.page - b.page);

      for (const p of pageTexts) {
        const pLen = p.text.length;
        pageMap.push({
          page: p.page,
          startIndex: currentOffset,
          endIndex: currentOffset + pLen,
        });
        currentOffset += pLen + 1;
      }

      return {
        text: fullText,
        pageCount,
        pageMap,
        isScannedOrEmpty: false,
      };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`Error parsing PDF: ${err.message}`, err.stack);
      throw new BadRequestException(`Không thể trích xuất nội dung từ tệp PDF: ${err.message}`);
    }
  }
}
