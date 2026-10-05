import { Injectable } from '@nestjs/common';
import { EmbeddingProvider } from '../interfaces/ai-provider.interface';
import * as crypto from 'crypto';

@Injectable()
export class MockEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'mock-embedding';
  readonly dimension = 1536;

  async embedQuery(text: string): Promise<number[]> {
    return this.generateDeterministicVector(text);
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.generateDeterministicVector(t));
  }

  /**
   * Generates a normalized 1536-dimensional vector deterministically from text.
   * Words contribute to vector components based on hash seeds, allowing semantic overlap
   * to produce realistic cosine similarity in tests.
   */
  private generateDeterministicVector(text: string): number[] {
    const vector = new Array<number>(this.dimension).fill(0);
    const cleanText = (text || '').toLowerCase().trim();
    const words = cleanText.split(/[\s,.;:!?\-—()[\]{}"']+/).filter((w) => w.length > 0);

    if (words.length === 0) {
      vector[0] = 1.0;
      return vector;
    }

    // Distribute word hashes across dimensions
    for (const word of words) {
      const hash = crypto.createHash('sha256').update(word).digest();
      for (let i = 0; i < 8; i++) {
        const index = hash.readUInt16BE(i * 2) % this.dimension;
        const sign = hash[i * 2 + 16] % 2 === 0 ? 1 : -1;
        const weight = (hash[i * 2 + 17] / 255) * 2;
        vector[index] += sign * weight;
      }
    }

    // Text length and character trigrams for general structure
    for (let i = 0; i < Math.min(cleanText.length - 2, 20); i++) {
      const trigram = cleanText.substring(i, i + 3);
      const hash = crypto.createHash('md5').update(trigram).digest();
      const index = hash.readUInt16BE(0) % this.dimension;
      vector[index] += 0.5;
    }

    // L2 normalize
    let sumSq = 0;
    for (let i = 0; i < this.dimension; i++) {
      sumSq += vector[i] * vector[i];
    }
    const norm = Math.sqrt(sumSq) || 1.0;

    for (let i = 0; i < this.dimension; i++) {
      vector[i] = Number((vector[i] / norm).toFixed(6));
    }

    return vector;
  }
}
