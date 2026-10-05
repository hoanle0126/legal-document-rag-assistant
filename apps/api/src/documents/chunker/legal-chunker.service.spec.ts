import { LegalChunkerService } from './legal-chunker.service';
import { LegalParserService } from '../legal-parser/legal-parser.service';

describe('LegalChunkerService', () => {
  let chunker: LegalChunkerService;
  let parser: LegalParserService;

  beforeEach(() => {
    chunker = new LegalChunkerService();
    parser = new LegalParserService();
  });

  it('should chunk on Article and Clause boundaries and preserve metadata', () => {
    const legalText = `
Chương I
QUY ĐỊNH CHUNG

Điều 1. Phạm vi điều chỉnh
1. Quy định về bảo mật dữ liệu khách hàng.
2. Quy định về xử lý vi phạm hợp đồng thương mại điện tử.

Điều 2. Biện pháp quản lý
Doanh nghiệp phải ban hành quy chế an toàn dữ liệu và phân công người phụ trách.
`;

    const parsed = parser.parse(legalText, {
      title: 'Quy chế An toàn Dữ liệu',
      documentNumber: 'QC-01',
    });

    const chunks = chunker.chunkDocument(
      parsed.rootNodes,
      {
        documentId: 'doc-123',
        documentTitle: 'Quy chế An toàn Dữ liệu',
        documentNumber: 'QC-01',
      },
      { maxTokens: 400, overlapTokens: 50 },
    );

    expect(chunks.length).toBeGreaterThanOrEqual(3);

    // Clause 1 chunk
    const clause1 = chunks.find((c) => c.article === '1' && c.clause === '1');
    expect(clause1).toBeDefined();
    expect(clause1?.content).toContain('1. Quy định về bảo mật dữ liệu khách hàng.');
    expect(clause1?.metadata.documentTitle).toBe('Quy chế An toàn Dữ liệu');

    // Clause 2 chunk
    const clause2 = chunks.find((c) => c.article === '1' && c.clause === '2');
    expect(clause2).toBeDefined();
    expect(clause2?.content).toContain('2. Quy định về xử lý vi phạm hợp đồng thương mại điện tử.');

    // Article 2 chunk
    const article2 = chunks.find((c) => c.article === '2');
    expect(article2).toBeDefined();
    expect(article2?.content).toContain('Doanh nghiệp phải ban hành quy chế an toàn dữ liệu');
  });
});
