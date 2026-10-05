export interface LlmCitationRef {
  citationId: string;
  documentId: string;
  documentTitle: string;
  article?: string;
  clause?: string;
  point?: string;
  page?: number;
  quote: string;
}

export interface StructuredLlmResponse {
  answer: string;
  confidence: 'high' | 'medium' | 'low';
  insufficientContext: boolean;
  citations: LlmCitationRef[];
  rawResponse?: string;
  providerName: string;
}

export interface LlmGenerationOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LlmProvider {
  readonly name: string;
  generateGroundedAnswer(options: LlmGenerationOptions): Promise<StructuredLlmResponse>;
}

export interface EmbeddingProvider {
  readonly name: string;
  readonly dimension: number;
  embedQuery(text: string): Promise<number[]>;
  embedDocuments(texts: string[]): Promise<number[][]>;
}
