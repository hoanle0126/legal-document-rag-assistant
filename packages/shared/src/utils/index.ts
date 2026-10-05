export function normalizeLegalText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \u00A0\u1680\u2000-\u200a\u202f\u205f\u3000\t]+/g, ' ').trim())
    .filter((line, i, arr) => {
      // Keep single blank line for paragraph separation, collapse multiples
      if (line === '' && (i === 0 || arr[i - 1] === '')) return false;
      return true;
    })
    .join('\n')
    .trim();
}

export function buildHierarchyPath(parts: (string | undefined | null)[]): string {
  return parts.filter(Boolean).join(' > ');
}

export function formatCitationLabel(citation: {
  documentTitle: string;
  article?: string;
  clause?: string;
  point?: string;
  page?: number;
}): string {
  const segments: string[] = [citation.documentTitle];
  if (citation.article) segments.push(`Điều ${citation.article}`);
  if (citation.clause) segments.push(`Khoản ${citation.clause}`);
  if (citation.point) segments.push(`Điểm ${citation.point}`);
  if (citation.page) segments.push(`Trang ${citation.page}`);
  return segments.join(', ');
}

export function truncateText(text: string, maxLength = 200): string {
  if (!text || text.length <= maxLength) return text || '';
  return text.slice(0, maxLength) + '...';
}
