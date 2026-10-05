import { LegalParserService } from './legal-parser.service';

describe('LegalParserService', () => {
  let parser: LegalParserService;

  beforeEach(() => {
    parser = new LegalParserService();
  });

  it('should parse chapters, articles, clauses, and points properly', () => {
    const legalText = `
Chương I
QUY ĐỊNH CHUNG

Điều 1. Phạm vi điều chỉnh
1. Luật này quy định về bảo vệ an ninh mạng.
2. Áp dụng đối với các cơ quan, tổ chức:
a) Doanh nghiệp trong nước;
b) Doanh nghiệp nước ngoài.

Điều 2. Giải thích từ ngữ
1. Không gian mạng là mạng lưới kết nối.
`;

    const parsed = parser.parse(legalText, {
      title: 'Luật An ninh mạng',
      documentNumber: '24/2018/QH14',
    });

    expect(parsed.title).toBe('Luật An ninh mạng');
    expect(parsed.documentNumber).toBe('24/2018/QH14');
    expect(parsed.rootNodes.length).toBeGreaterThan(0);

    const chapter = parsed.rootNodes[0];
    expect(chapter.type).toBe('CHAPTER');
    expect(chapter.number).toBe('I');

    // Chapter should contain 2 articles
    expect(chapter.children.length).toBe(2);

    const article1 = chapter.children[0];
    expect(article1.type).toBe('ARTICLE');
    expect(article1.number).toBe('1');
    expect(article1.hierarchyPath).toBe('Chương I > Điều 1');

    // Article 1 should contain 2 clauses
    expect(article1.children.length).toBe(2);
    const clause2 = article1.children[1];
    expect(clause2.type).toBe('CLAUSE');
    expect(clause2.number).toBe('2');

    // Clause 2 should contain 2 points
    expect(clause2.children.length).toBe(2);
    expect(clause2.children[0].type).toBe('POINT');
    expect(clause2.children[0].number).toBe('a');
    expect(clause2.children[1].number).toBe('b');
  });

  it('should fallback gracefully for unstructured documents without losing text', () => {
    const raw = 'Đây là văn bản hướng dẫn nghiệp vụ nội bộ không có cấu trúc điều khoản.';
    const parsed = parser.parse(raw);

    expect(parsed.rootNodes.length).toBe(1);
    expect(parsed.rootNodes[0].type).toBe('UNSTRUCTURED');
    expect(parsed.rootNodes[0].content).toContain(raw);
  });
});
