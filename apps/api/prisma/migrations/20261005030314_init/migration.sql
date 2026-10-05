-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "LegalDocumentType" AS ENUM ('LAW', 'DECREE', 'CIRCULAR', 'DECISION', 'REGULATION', 'RESOLUTION', 'ORDER', 'DIRECTIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "IngestionStatus" AS ENUM ('PENDING', 'PROCESSING', 'INDEXED', 'FAILED');

-- CreateEnum
CREATE TYPE "IngestionSourceType" AS ENUM ('PDF', 'TXT', 'MARKDOWN', 'URL', 'MANUAL');

-- CreateEnum
CREATE TYPE "LegalNodeType" AS ENUM ('DOCUMENT', 'PART', 'CHAPTER', 'SECTION', 'SUBSECTION', 'ARTICLE', 'CLAUSE', 'POINT', 'PARAGRAPH', 'UNSTRUCTURED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "documentNumber" TEXT,
    "documentType" "LegalDocumentType" NOT NULL DEFAULT 'LAW',
    "issuingAuthority" TEXT,
    "sourceUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "effectiveAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "status" "IngestionStatus" NOT NULL DEFAULT 'PENDING',
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_versions" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "checksum" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "sourceFileName" TEXT,
    "sourceMimeType" TEXT,
    "sourceType" "IngestionSourceType" NOT NULL DEFAULT 'MANUAL',
    "pageCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_nodes" (
    "id" TEXT NOT NULL,
    "documentVersionId" TEXT NOT NULL,
    "parentId" TEXT,
    "type" "LegalNodeType" NOT NULL DEFAULT 'UNSTRUCTURED',
    "number" TEXT,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "hierarchyPath" TEXT NOT NULL,
    "page" INTEGER,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,

    CONSTRAINT "legal_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_chunks" (
    "id" TEXT NOT NULL,
    "documentVersionId" TEXT NOT NULL,
    "legalNodeId" TEXT,
    "content" TEXT NOT NULL,
    "tokenCount" INTEGER NOT NULL DEFAULT 0,
    "article" TEXT,
    "clause" TEXT,
    "point" TEXT,
    "page" INTEGER,
    "hierarchyPath" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingestion_jobs" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "status" "IngestionStatus" NOT NULL DEFAULT 'PENDING',
    "sourceType" "IngestionSourceType" NOT NULL,
    "sourceUrl" TEXT,
    "sourceFileName" TEXT,
    "errorMessage" TEXT,
    "chunksCount" INTEGER NOT NULL DEFAULT 0,
    "processingTimeMs" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingestion_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL DEFAULT 'Phiên hỏi đáp pháp lý',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "confidence" TEXT,
    "insufficientContext" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT,
    "executionTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retrieved_citations" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "chunkId" TEXT,
    "citationIndex" INTEGER NOT NULL,
    "documentTitle" TEXT NOT NULL,
    "documentNumber" TEXT,
    "article" TEXT,
    "clause" TEXT,
    "point" TEXT,
    "page" INTEGER,
    "quote" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "similarity" DOUBLE PRECISION,
    "sourceUrl" TEXT,
    "hierarchyPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retrieved_citations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "documents_status_idx" ON "documents"("status");

-- CreateIndex
CREATE INDEX "documents_documentType_idx" ON "documents"("documentType");

-- CreateIndex
CREATE INDEX "documents_documentNumber_idx" ON "documents"("documentNumber");

-- CreateIndex
CREATE INDEX "document_versions_checksum_idx" ON "document_versions"("checksum");

-- CreateIndex
CREATE UNIQUE INDEX "document_versions_documentId_version_key" ON "document_versions"("documentId", "version");

-- CreateIndex
CREATE INDEX "legal_nodes_documentVersionId_orderIndex_idx" ON "legal_nodes"("documentVersionId", "orderIndex");

-- CreateIndex
CREATE INDEX "legal_nodes_hierarchyPath_idx" ON "legal_nodes"("hierarchyPath");

-- CreateIndex
CREATE INDEX "document_chunks_documentVersionId_idx" ON "document_chunks"("documentVersionId");

-- CreateIndex
CREATE INDEX "document_chunks_legalNodeId_idx" ON "document_chunks"("legalNodeId");

-- CreateIndex
CREATE INDEX "ingestion_jobs_documentId_idx" ON "ingestion_jobs"("documentId");

-- CreateIndex
CREATE INDEX "ingestion_jobs_status_idx" ON "ingestion_jobs"("status");

-- CreateIndex
CREATE INDEX "chat_sessions_userId_idx" ON "chat_sessions"("userId");

-- CreateIndex
CREATE INDEX "chat_messages_sessionId_createdAt_idx" ON "chat_messages"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "retrieved_citations_messageId_idx" ON "retrieved_citations"("messageId");

-- CreateIndex
CREATE INDEX "retrieved_citations_chunkId_idx" ON "retrieved_citations"("chunkId");

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_nodes" ADD CONSTRAINT "legal_nodes_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "document_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_nodes" ADD CONSTRAINT "legal_nodes_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "legal_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "document_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_legalNodeId_fkey" FOREIGN KEY ("legalNodeId") REFERENCES "legal_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingestion_jobs" ADD CONSTRAINT "ingestion_jobs_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retrieved_citations" ADD CONSTRAINT "retrieved_citations_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retrieved_citations" ADD CONSTRAINT "retrieved_citations_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "document_chunks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateHnswAndGinIndexes
CREATE INDEX IF NOT EXISTS "document_chunks_embedding_hnsw_idx" ON "document_chunks" USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX IF NOT EXISTS "document_chunks_content_tsv_idx" ON "document_chunks" USING gin (to_tsvector('simple', "content"));
