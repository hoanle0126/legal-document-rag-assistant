import { Injectable, Logger } from '@nestjs/common';
import {
  LegalNodeType,
  LegalDocumentType,
  ParsedLegalNode,
  ParsedDocumentResult,
  normalizeLegalText,
  buildHierarchyPath,
  LEGAL_PATTERNS,
} from '@legal-rag/shared';

@Injectable()
export class LegalParserService {
  private readonly logger = new Logger(LegalParserService.name);

  /**
   * Parses raw Vietnamese legal text into a structured hierarchical node tree.
   * Preserves all original text and falls back gracefully when structure is loose.
   */
  parse(
    rawText: string,
    metadata: {
      title?: string;
      documentNumber?: string;
      documentType?: LegalDocumentType;
      issuingAuthority?: string;
      publishedAt?: string;
      effectiveAt?: string;
      pageMap?: { page: number; startIndex: number; endIndex: number }[];
    } = {},
  ): ParsedDocumentResult {
    const normalized = normalizeLegalText(rawText);
    const lines = normalized.split('\n');

    const rootNodes: ParsedLegalNode[] = [];
    let currentPart: ParsedLegalNode | null = null;
    let currentChapter: ParsedLegalNode | null = null;
    let currentSection: ParsedLegalNode | null = null;
    let currentArticle: ParsedLegalNode | null = null;
    let currentClause: ParsedLegalNode | null = null;
    let currentPoint: ParsedLegalNode | null = null;
    let currentLeaf: ParsedLegalNode | null = null;

    let orderIndex = 0;
    let charCursor = 0;

    const getPageNumber = (index: number): number | undefined => {
      if (!metadata.pageMap || metadata.pageMap.length === 0) return undefined;
      const found = metadata.pageMap.find(
        (p) => index >= p.startIndex && index <= p.endIndex,
      );
      return found ? found.page : undefined;
    };

    const detectedDocType = metadata.documentType || this.inferDocumentType(rawText);
    const detectedDocNumber = metadata.documentNumber || this.inferDocumentNumber(rawText);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineStartChar = charCursor;
      charCursor += line.length + 1; // + 1 for \n

      if (!line) continue;

      const pageNum = getPageNumber(lineStartChar);

      // Check Part (Phần)
      const partMatch = line.match(LEGAL_PATTERNS.PART);
      if (partMatch) {
        currentPart = {
          type: 'PART',
          number: partMatch[1]?.trim(),
          title: partMatch[2]?.trim() || line,
          content: line,
          originalText: line,
          page: pageNum,
          orderIndex: orderIndex++,
          hierarchyPath: `Phần ${partMatch[1]?.trim() || ''}`,
          children: [],
        };
        rootNodes.push(currentPart);
        currentChapter = null;
        currentSection = null;
        currentArticle = null;
        currentClause = null;
        currentPoint = null;
        currentLeaf = currentPart;
        continue;
      }

      // Check Chapter (Chương)
      const chapterMatch = line.match(LEGAL_PATTERNS.CHAPTER);
      if (chapterMatch) {
        const chapterNum = chapterMatch[1]?.trim();
        // Sometimes title is on the next line if the chapter line is just "Chương I"
        let chapterTitle = chapterMatch[2]?.trim() || '';
        if (!chapterTitle && i + 1 < lines.length && lines[i + 1].trim() && !this.isHeading(lines[i + 1])) {
          chapterTitle = lines[i + 1].trim();
          i++;
        }

        const pathParts = [
          currentPart ? `Phần ${currentPart.number}` : null,
          `Chương ${chapterNum}`,
        ];

        currentChapter = {
          type: 'CHAPTER',
          number: chapterNum,
          title: chapterTitle || `Chương ${chapterNum}`,
          content: `${line}${chapterTitle ? '\n' + chapterTitle : ''}`,
          originalText: `${line}${chapterTitle ? '\n' + chapterTitle : ''}`,
          page: pageNum,
          orderIndex: orderIndex++,
          hierarchyPath: buildHierarchyPath(pathParts),
          children: [],
        };

        if (currentPart) {
          currentPart.children.push(currentChapter);
        } else {
          rootNodes.push(currentChapter);
        }

        currentSection = null;
        currentArticle = null;
        currentClause = null;
        currentPoint = null;
        currentLeaf = currentChapter;
        continue;
      }

      // Check Section (Mục)
      const sectionMatch = line.match(LEGAL_PATTERNS.SECTION);
      if (sectionMatch) {
        const secNum = sectionMatch[1]?.trim();
        let secTitle = sectionMatch[2]?.trim() || '';
        if (!secTitle && i + 1 < lines.length && lines[i + 1].trim() && !this.isHeading(lines[i + 1])) {
          secTitle = lines[i + 1].trim();
          i++;
        }

        const pathParts = [
          currentChapter?.hierarchyPath,
          `Mục ${secNum}`,
        ];

        currentSection = {
          type: 'SECTION',
          number: secNum,
          title: secTitle || `Mục ${secNum}`,
          content: `${line}${secTitle ? '\n' + secTitle : ''}`,
          originalText: `${line}${secTitle ? '\n' + secTitle : ''}`,
          page: pageNum,
          orderIndex: orderIndex++,
          hierarchyPath: buildHierarchyPath(pathParts),
          children: [],
        };

        if (currentChapter) {
          currentChapter.children.push(currentSection);
        } else if (currentPart) {
          currentPart.children.push(currentSection);
        } else {
          rootNodes.push(currentSection);
        }

        currentArticle = null;
        currentClause = null;
        currentPoint = null;
        currentLeaf = currentSection;
        continue;
      }

      // Check Article (Điều)
      const articleMatch = line.match(LEGAL_PATTERNS.ARTICLE);
      if (articleMatch) {
        const artNum = articleMatch[1]?.trim();
        let artTitle = articleMatch[2]?.trim() || '';
        if (!artTitle && i + 1 < lines.length && lines[i + 1].trim() && !this.isHeading(lines[i + 1])) {
          artTitle = lines[i + 1].trim();
          i++;
        }

        const parentPath = currentSection?.hierarchyPath || currentChapter?.hierarchyPath || (currentPart ? `Phần ${currentPart.number}` : null);
        const pathParts = [parentPath, `Điều ${artNum}`];

        currentArticle = {
          type: 'ARTICLE',
          number: artNum,
          title: artTitle || `Điều ${artNum}`,
          content: `${line}${artTitle ? '\n' + artTitle : ''}`,
          originalText: `${line}${artTitle ? '\n' + artTitle : ''}`,
          page: pageNum,
          orderIndex: orderIndex++,
          hierarchyPath: buildHierarchyPath(pathParts),
          children: [],
        };

        const parentContainer = currentSection || currentChapter || currentPart;
        if (parentContainer) {
          parentContainer.children.push(currentArticle);
        } else {
          rootNodes.push(currentArticle);
        }

        currentClause = null;
        currentPoint = null;
        currentLeaf = currentArticle;
        continue;
      }

      // Inside Article: Check Clause (Khoản)
      if (currentArticle) {
        const clauseMatch = line.match(LEGAL_PATTERNS.CLAUSE);
        if (clauseMatch) {
          const clauseNum = clauseMatch[1] || clauseMatch[3];
          const clauseBody = clauseMatch[2] || clauseMatch[4] || '';

          const pathParts = [currentArticle.hierarchyPath, `Khoản ${clauseNum}`];

          currentClause = {
            type: 'CLAUSE',
            number: clauseNum,
            title: `Khoản ${clauseNum}`,
            content: line,
            originalText: line,
            page: pageNum,
            orderIndex: orderIndex++,
            hierarchyPath: buildHierarchyPath(pathParts),
            children: [],
          };

          currentArticle.children.push(currentClause);
          currentPoint = null;
          currentLeaf = currentClause;
          continue;
        }

        // Inside Clause (or directly inside Article): Check Point (Điểm)
        const pointMatch = line.match(LEGAL_PATTERNS.POINT);
        if (pointMatch) {
          const pointLetter = pointMatch[1] || pointMatch[3];

          const parentForPoint = currentClause || currentArticle;
          const pathParts = [parentForPoint.hierarchyPath, `Điểm ${pointLetter}`];

          currentPoint = {
            type: 'POINT',
            number: pointLetter,
            title: `Điểm ${pointLetter}`,
            content: line,
            originalText: line,
            page: pageNum,
            orderIndex: orderIndex++,
            hierarchyPath: buildHierarchyPath(pathParts),
            children: [],
          };

          parentForPoint.children.push(currentPoint);
          currentLeaf = currentPoint;
          continue;
        }
      }

      // Regular line content - append to active leaf or create unstructured fallback
      if (currentLeaf) {
        currentLeaf.content += '\n' + line;
        currentLeaf.originalText += '\n' + line;
      } else {
        // Text appearing before first Part/Chapter/Article (e.g. document header, preamble)
        const preambleNode: ParsedLegalNode = {
          type: 'UNSTRUCTURED',
          title: 'Lời nói đầu / Căn cứ ban hành',
          content: line,
          originalText: line,
          page: pageNum,
          orderIndex: orderIndex++,
          hierarchyPath: 'Căn cứ ban hành',
          children: [],
        };
        rootNodes.push(preambleNode);
        currentLeaf = preambleNode;
      }
    }

    // Safety fallback: if no structure was found at all
    if (rootNodes.length === 0 && normalized.trim().length > 0) {
      rootNodes.push({
        type: 'UNSTRUCTURED',
        title: metadata.title || 'Nội dung văn bản',
        content: normalized,
        originalText: normalized,
        orderIndex: 0,
        hierarchyPath: 'Toàn văn',
        children: [],
      });
    }

    return {
      title: metadata.title || this.inferTitle(lines) || 'Văn bản pháp luật',
      documentNumber: detectedDocNumber,
      documentType: detectedDocType,
      issuingAuthority: metadata.issuingAuthority || this.inferAuthority(lines),
      publishedAt: metadata.publishedAt,
      effectiveAt: metadata.effectiveAt,
      rawText: normalized,
      rootNodes,
    };
  }

  private isHeading(line: string): boolean {
    return (
      LEGAL_PATTERNS.PART.test(line) ||
      LEGAL_PATTERNS.CHAPTER.test(line) ||
      LEGAL_PATTERNS.SECTION.test(line) ||
      LEGAL_PATTERNS.ARTICLE.test(line)
    );
  }

  private inferDocumentType(text: string): LegalDocumentType {
    const upper = text.toUpperCase();
    if (upper.includes('LUẬT') || upper.includes('BỘ LUẬT')) return 'LAW';
    if (upper.includes('NGHỊ ĐỊNH')) return 'DECREE';
    if (upper.includes('THÔNG TƯ')) return 'CIRCULAR';
    if (upper.includes('QUYẾT ĐỊNH')) return 'DECISION';
    if (upper.includes('NGHỊ QUYẾT')) return 'RESOLUTION';
    if (upper.includes('QUY CHẾ') || upper.includes('QUY ĐỊNH')) return 'REGULATION';
    if (upper.includes('LỆNH')) return 'ORDER';
    if (upper.includes('CHỈ THỊ')) return 'DIRECTIVE';
    return 'OTHER';
  }

  private inferDocumentNumber(text: string): string | undefined {
    const match = text.match(/Số\s*:\s*([0-9]+\/[0-9]+\/[A-ZĐa-zđ0-9\-\_]+)/i);
    return match ? match[1].trim() : undefined;
  }

  private inferAuthority(lines: string[]): string | undefined {
    const firstLines = lines.slice(0, 15);
    for (const line of firstLines) {
      const upper = line.toUpperCase();
      if (upper.includes('QUỐC HỘI')) return 'Quốc hội';
      if (upper.includes('CHÍNH PHỦ')) return 'Chính phủ';
      if (upper.includes('THỦ TƯỚNG CHÍNH PHỦ')) return 'Thủ tướng Chính phủ';
      if (upper.includes('BỘ CÔNG AN')) return 'Bộ Công an';
      if (upper.includes('BỘ TƯ PHÁP')) return 'Bộ Tư pháp';
      if (upper.includes('BỘ TÀI CHÍNH')) return 'Bộ Tài chính';
      if (upper.includes('BỘ THÔNG TIN VÀ TRUYỀN THÔNG')) return 'Bộ Thông tin và Truyền thông';
      if (upper.includes('NGÂN HÀNG NHÀ NƯỚC')) return 'Ngân hàng Nhà nước';
    }
    return undefined;
  }

  private inferTitle(lines: string[]): string | undefined {
    const firstLines = lines.slice(0, 20);
    for (let i = 0; i < firstLines.length; i++) {
      const line = firstLines[i].trim();
      const upper = line.toUpperCase();
      if (
        upper.startsWith('LUẬT') ||
        upper.startsWith('NGHỊ ĐỊNH') ||
        upper.startsWith('THÔNG TƯ') ||
        upper.startsWith('QUY CHẾ') ||
        upper.startsWith('QUYẾT ĐỊNH')
      ) {
        return line;
      }
    }
    return undefined;
  }
}
