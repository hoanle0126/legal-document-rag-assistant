import { normalizeLegalText, buildHierarchyPath, formatCitationLabel } from './index';

describe('Shared Utils', () => {
  it('should normalize legal text whitespace and newlines', () => {
    const raw = '  Điều 1.   Phạm vi điều chỉnh \r\n\r\n\r\n Nội dung  khoản 1. ';
    const normalized = normalizeLegalText(raw);
    expect(normalized).toBe('Điều 1. Phạm vi điều chỉnh\n\nNội dung khoản 1.');
  });

  it('should build hierarchy path properly', () => {
    const path = buildHierarchyPath(['Chương I', 'Điều 1', 'Khoản 2', undefined, 'Điểm a']);
    expect(path).toBe('Chương I > Điều 1 > Khoản 2 > Điểm a');
  });

  it('should format citation label properly', () => {
    const label = formatCitationLabel({
      documentTitle: 'Luật An ninh mạng 2018',
      article: '10',
      clause: '2',
      point: 'a',
      page: 4,
    });
    expect(label).toBe('Luật An ninh mạng 2018, Điều 10, Khoản 2, Điểm a, Trang 4');
  });
});
