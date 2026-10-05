export type LegalNodeType =
  | 'DOCUMENT'
  | 'PART'
  | 'CHAPTER'
  | 'SECTION'
  | 'SUBSECTION'
  | 'ARTICLE'
  | 'CLAUSE'
  | 'POINT'
  | 'PARAGRAPH'
  | 'UNSTRUCTURED';

export type LegalDocumentType =
  | 'LAW'
  | 'DECREE'
  | 'CIRCULAR'
  | 'DECISION'
  | 'REGULATION'
  | 'RESOLUTION'
  | 'ORDER'
  | 'DIRECTIVE'
  | 'OTHER';

export type IngestionStatus = 'PENDING' | 'PROCESSING' | 'INDEXED' | 'FAILED';

export type IngestionSourceType = 'PDF' | 'TXT' | 'MARKDOWN' | 'URL' | 'MANUAL';

export interface LegalNodeMetadata {
  documentId?: string;
  documentTitle?: string;
  documentNumber?: string;
  documentType?: LegalDocumentType;
  issuingAuthority?: string;
  publishedAt?: string;
  effectiveAt?: string;
  expiredAt?: string;
  part?: string;
  chapter?: string;
  section?: string;
  article?: string;
  clause?: string;
  point?: string;
  sourceUrl?: string;
  page?: number;
  orderIndex: number;
}

export interface ParsedLegalNode {
  id?: string;
  type: LegalNodeType;
  number?: string;
  title?: string;
  content: string;
  originalText: string;
  page?: number;
  orderIndex: number;
  hierarchyPath: string; // e.g. "Chương I > Điều 1 > Khoản 2"
  metadata?: Record<string, any>;
  children: ParsedLegalNode[];
}

export interface ParsedDocumentResult {
  title: string;
  documentNumber?: string;
  documentType?: LegalDocumentType;
  issuingAuthority?: string;
  publishedAt?: string;
  effectiveAt?: string;
  rawText: string;
  pageCount?: number;
  rootNodes: ParsedLegalNode[];
  summary?: string;
}

export interface DocumentChunkData {
  id?: string;
  documentVersionId?: string;
  legalNodeId?: string;
  content: string;
  tokenCount: number;
  page?: number;
  article?: string;
  clause?: string;
  point?: string;
  hierarchyPath: string;
  metadata: {
    documentId: string;
    documentTitle: string;
    documentNumber?: string;
    documentType?: string;
    issuingAuthority?: string;
    sourceUrl?: string;
    page?: number;
    article?: string;
    clause?: string;
    point?: string;
    hierarchyPath: string;
    [key: string]: any;
  };
}

export interface Citation {
  citationId: string;
  chunkId: string;
  documentId: string;
  documentTitle: string;
  documentNumber?: string;
  article?: string;
  clause?: string;
  point?: string;
  page?: number;
  quote: string;
  verified: boolean;
  sourceUrl?: string;
  hierarchyPath?: string;
}

export type RetrievedCitation = Citation;

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  documentNumber?: string;
  content: string;
  article?: string;
  clause?: string;
  point?: string;
  page?: number;
  similarity: number;
  keywordScore?: number;
  hybridScore: number;
  hierarchyPath: string;
  sourceUrl?: string;
}

export interface RagQueryOptions {
  topK?: number;
  similarityThreshold?: number;
  documentIds?: string[];
  documentTypes?: LegalDocumentType[];
  filterAuthority?: string;
}

export interface RagAnswerResult {
  answer: string;
  confidence: 'high' | 'medium' | 'low';
  insufficientContext: boolean;
  citations: Citation[];
  retrievedChunks: RetrievedChunk[];
  executionTimeMs: number;
  provider: string;
  disclaimer: string;
}

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
}

export interface AuthTokens {
  accessToken: string;
  user: UserSummary;
}

export interface SystemHealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  services: {
    api: string;
    database: string;
    pgvector: string;
    redis: string;
  };
  environment: string;
  uptime: number;
}
