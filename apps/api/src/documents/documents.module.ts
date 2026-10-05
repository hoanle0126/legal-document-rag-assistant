import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { LegalParserService } from './legal-parser/legal-parser.service';
import { LegalChunkerService } from './chunker/legal-chunker.service';
import { SsrfValidatorService } from './ssrf/ssrf-validator.service';
import { PdfExtractorService } from './extractors/pdf-extractor.service';
import { UrlExtractorService } from './extractors/url-extractor.service';
import { TextExtractorService } from './extractors/text-extractor.service';
import { VectorModule } from '../vector/vector.module';

@Module({
  imports: [VectorModule],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    LegalParserService,
    LegalChunkerService,
    SsrfValidatorService,
    PdfExtractorService,
    UrlExtractorService,
    TextExtractorService,
  ],
  exports: [
    DocumentsService,
    LegalParserService,
    LegalChunkerService,
    SsrfValidatorService,
    PdfExtractorService,
    UrlExtractorService,
    TextExtractorService,
  ],
})
export class DocumentsModule {}
