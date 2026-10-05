import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { IngestUrlDto } from './dto/ingest-url.dto';
import { IngestTextDto } from './dto/ingest-text.dto';
import { FilterDocumentsDto } from './dto/filter-documents.dto';
import { PdfExtractorService } from './extractors/pdf-extractor.service';
import { UrlExtractorService } from './extractors/url-extractor.service';
import { TextExtractorService } from './extractors/text-extractor.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import * as path from 'path';

@ApiTags('Documents - Quản lý Văn bản Pháp luật')
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly pdfExtractor: PdfExtractorService,
    private readonly urlExtractor: UrlExtractorService,
    private readonly textExtractor: TextExtractorService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách văn bản pháp luật có lọc và phân trang' })
  @ApiResponse({ status: 200, description: 'Danh sách văn bản pháp luật' })
  async findAll(@Query() filterDto: FilterDocumentsDto) {
    return this.documentsService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một văn bản pháp luật' })
  @ApiResponse({ status: 200, description: 'Chi tiết văn bản' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy văn bản' })
  async findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Get(':id/structure')
  @ApiOperation({ summary: 'Lấy cây phân cấp cấu trúc pháp lý (Chương -> Mục -> Điều -> Khoản -> Điểm)' })
  @ApiResponse({ status: 200, description: 'Cây cấu trúc phân cấp' })
  async getStructure(@Param('id') id: string) {
    return this.documentsService.getDocumentStructure(id);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Lấy lịch sử các phiên bản của văn bản' })
  @ApiResponse({ status: 200, description: 'Danh sách phiên bản' })
  async getVersions(@Param('id') id: string) {
    return this.documentsService.getVersions(id);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
      fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const allowedExtensions = ['.pdf', '.txt', '.md', '.markdown'];
        const allowedMimeTypes = [
          'application/pdf',
          'text/plain',
          'text/markdown',
          'application/octet-stream',
        ];

        if (!allowedExtensions.includes(ext) || !allowedMimeTypes.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              `Định dạng tệp không được hỗ trợ (${ext}). Chỉ chấp nhận PDF, TXT hoặc Markdown.`,
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Tải lên tài liệu PDF, TXT hoặc Markdown để nạp vào hệ thống' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Tệp văn bản pháp luật (PDF/TXT/MD)' },
        title: { type: 'string', description: 'Tiêu đề văn bản (tùy chọn)' },
        documentNumber: { type: 'string', description: 'Số hiệu văn bản (tùy chọn)' },
        documentType: { type: 'string', description: 'Loại văn bản (tùy chọn)' },
        issuingAuthority: { type: 'string', description: 'Cơ quan ban hành (tùy chọn)' },
      },
    },
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title?: string,
    @Body('documentNumber') documentNumber?: string,
    @Body('documentType') documentType?: any,
    @Body('issuingAuthority') issuingAuthority?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn tệp để tải lên.');
    }

    // Sanitize filename to prevent directory traversal
    const safeOriginalName = path.basename(file.originalname).replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const ext = path.extname(safeOriginalName).toLowerCase();

    let rawContent = '';
    let pageCount = 1;
    let pageMap: any = undefined;
    let sourceType: any = 'TXT';

    if (ext === '.pdf') {
      sourceType = 'PDF';
      const pdfRes = await this.pdfExtractor.extractText(file.buffer);
      rawContent = pdfRes.text;
      pageCount = pdfRes.pageCount;
      pageMap = pdfRes.pageMap;
    } else {
      sourceType = ext === '.md' || ext === '.markdown' ? 'MARKDOWN' : 'TXT';
      rawContent = this.textExtractor.extract(file.buffer.toString('utf-8'));
    }

    return this.documentsService.ingestDocument({
      title: title || safeOriginalName.replace(/\.[^/.]+$/, ''),
      content: rawContent,
      sourceType,
      sourceFileName: safeOriginalName,
      sourceMimeType: file.mimetype,
      documentNumber,
      documentType,
      issuingAuthority,
      pageCount,
      pageMap,
    });
  }

  @Post('url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Nạp văn bản pháp luật từ địa chỉ URL công khai (Bảo vệ SSRF)' })
  @ApiResponse({ status: 200, description: 'Nạp và lập chỉ mục thành công từ URL' })
  async ingestFromUrl(@Body() dto: IngestUrlDto) {
    const extracted = await this.urlExtractor.extractFromUrl(dto.url);

    return this.documentsService.ingestDocument({
      title: dto.title || extracted.title,
      content: extracted.text,
      sourceType: 'URL',
      sourceUrl: extracted.sourceUrl,
      documentNumber: dto.documentNumber,
      documentType: dto.documentType,
      issuingAuthority: dto.issuingAuthority,
    });
  }

  @Post('text')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Nạp văn bản pháp luật bằng nhập liệu văn bản trực tiếp' })
  @ApiResponse({ status: 200, description: 'Nạp và lập chỉ mục thành công' })
  async ingestFromText(@Body() dto: IngestTextDto) {
    const cleanContent = this.textExtractor.extract(dto.content);

    return this.documentsService.ingestDocument({
      title: dto.title,
      content: cleanContent,
      sourceType: 'MANUAL',
      documentNumber: dto.documentNumber,
      documentType: dto.documentType,
      issuingAuthority: dto.issuingAuthority,
      publishedAt: dto.publishedAt,
      effectiveAt: dto.effectiveAt,
    });
  }

  @Post(':id/reindex')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lập chỉ mục lại văn bản pháp luật (re-chunk và re-embed)' })
  async reindex(@Param('id') id: string) {
    return this.documentsService.reindex(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa một văn bản pháp luật và toàn bộ phân đoạn/chỉ mục liên quan' })
  async delete(@Param('id') id: string) {
    return this.documentsService.delete(id);
  }
}
