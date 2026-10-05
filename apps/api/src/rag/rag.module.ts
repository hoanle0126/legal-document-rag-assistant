import { Module } from '@nestjs/common';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { PromptBuilderService } from './prompt-builder.service';
import { CitationValidatorService } from './citation-validator.service';
import { VectorModule } from '../vector/vector.module';

@Module({
  imports: [VectorModule],
  controllers: [RagController],
  providers: [RagService, PromptBuilderService, CitationValidatorService],
  exports: [RagService, CitationValidatorService],
})
export class RagModule {}
