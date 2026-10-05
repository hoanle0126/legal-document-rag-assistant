import { CitationValidatorService } from './citation-validator.service';
import { RetrievedChunk } from '@legal-rag/shared';

describe('CitationValidatorService', () => {
  let validator: CitationValidatorService;

  const sampleRetrievedChunks: RetrievedChunk[] = [
    {
      chunkId: 'chunk-1',
      documentId: 'doc-1',
      documentTitle: 'Nghị định số 13/2023/NĐ-CP',
      documentNumber: '13/2023/NĐ-CP',
      content:
        'Thời hạn thông báo vi phạm quy định về bảo vệ dữ liệu cá nhân: Trong thời hạn 72 giờ kể từ khi phát hiện hành vi vi phạm.',
      article: '12',
      clause: '3',
      page: 5,
      similarity: 0.88,
      hybridScore: 0.85,
      hierarchyPath: 'Chương II > Điều 12 > Khoản 3',
    },
  ];

  beforeEach(() => {
    validator = new CitationValidatorService();
  });

  it('should verify legitimate citations matching retrieved chunks', () => {
    const rawCitations = [
      {
        citationId: 'chunk-1',
        documentId: 'doc-1',
        documentTitle: 'Nghị định số 13/2023/NĐ-CP',
        article: '12',
        clause: '3',
        page: 5,
        quote: 'Trong thời hạn 72 giờ kể từ khi phát hiện',
      },
    ];

    const verified = validator.validateCitations(rawCitations, sampleRetrievedChunks);

    expect(verified.length).toBe(1);
    expect(verified[0].chunkId).toBe('chunk-1');
    expect(verified[0].verified).toBe(true);
    expect(verified[0].documentTitle).toBe('Nghị định số 13/2023/NĐ-CP');
  });

  it('should REJECT and PURGE fake citations that do not exist in retrieved chunks', () => {
    const rawCitationsWithHallucination = [
      {
        citationId: 'chunk-1',
        documentId: 'doc-1',
        documentTitle: 'Nghị định số 13/2023/NĐ-CP',
        quote: 'Trong thời hạn 72 giờ kể từ khi phát hiện',
      },
      {
        citationId: 'fake-hallucinated-chunk-999',
        documentId: 'fake-doc',
        documentTitle: 'Luật Giả Mạo 2099',
        quote: 'Điều này hoàn toàn do AI tự bịa đặt và không hề tồn tại trong context.',
      },
    ];

    const verified = validator.validateCitations(
      rawCitationsWithHallucination,
      sampleRetrievedChunks,
    );

    // Only the real chunk must pass; fake one must be dropped!
    expect(verified.length).toBe(1);
    expect(verified[0].chunkId).toBe('chunk-1');
    expect(verified.find((c) => c.citationId === 'fake-hallucinated-chunk-999')).toBeUndefined();
  });
});
