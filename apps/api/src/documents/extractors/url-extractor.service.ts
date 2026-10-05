import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { SsrfValidatorService } from '../ssrf/ssrf-validator.service';

export interface ExtractedUrlResult {
  title: string;
  text: string;
  sourceUrl: string;
}

@Injectable()
export class UrlExtractorService {
  private readonly logger = new Logger(UrlExtractorService.name);
  private readonly MAX_REDIRECTS = 5;
  private readonly MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
  private readonly TIMEOUT_MS = 10000; // 10 seconds

  constructor(private readonly ssrfValidator: SsrfValidatorService) {}

  /**
   * Fetches public web page content with strict SSRF defense across redirects.
   */
  async extractFromUrl(targetUrl: string): Promise<ExtractedUrlResult> {
    let currentUrl = targetUrl;
    let redirectCount = 0;
    let finalHtml = '';

    while (redirectCount <= this.MAX_REDIRECTS) {
      // 1. SSRF validation on the URL before making request
      await this.ssrfValidator.validateUrl(currentUrl);

      let response: AxiosResponse<any>;
      try {
        response = await axios.get(currentUrl, {
          timeout: this.TIMEOUT_MS,
          maxRedirects: 0, // Disable automatic redirects to intercept and validate each redirect
          validateStatus: (status) => status >= 200 && status < 400,
          responseType: 'text',
          maxContentLength: this.MAX_SIZE_BYTES,
          headers: {
            'User-Agent': 'LegalRagAssistant/1.0 (+https://legalrag.local/bot)',
            Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
          },
        });
      } catch (err: any) {
        if (err.response && [301, 302, 303, 307, 308].includes(err.response.status)) {
          const locationHeader = err.response.headers.location;
          if (!locationHeader) {
            throw new BadRequestException('Chuyển hướng không có tiêu đề Location.');
          }
          // Resolve relative redirect against currentUrl
          const nextUrl = new URL(locationHeader, currentUrl).toString();
          this.logger.log(`Theo dõi chuyển hướng an toàn: ${currentUrl} -> ${nextUrl}`);
          currentUrl = nextUrl;
          redirectCount++;
          continue;
        }

        this.logger.warn(`Lỗi tải trang từ URL ${currentUrl}: ${err.message}`);
        throw new BadRequestException(`Không thể tải nội dung từ URL: ${err.message}`);
      }

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const locationHeader = response.headers.location;
        if (!locationHeader) {
          throw new BadRequestException('Chuyển hướng không có tiêu đề Location.');
        }
        const nextUrl = new URL(locationHeader, currentUrl).toString();
        currentUrl = nextUrl;
        redirectCount++;
        continue;
      }

      finalHtml = response.data;
      break;
    }

    if (!finalHtml || typeof finalHtml !== 'string') {
      throw new BadRequestException('Không nhận được nội dung văn bản từ URL được chỉ định.');
    }

    const { title, text } = this.cleanHtml(finalHtml);

    if (text.length < 50) {
      throw new BadRequestException('Nội dung trang web quá ngắn hoặc không chứa văn bản hợp lệ.');
    }

    return {
      title,
      text,
      sourceUrl: currentUrl,
    };
  }

  private cleanHtml(html: string): { title: string; text: string } {
    // Extract title
    let title = 'Văn bản nạp từ URL';
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      title = this.decodeHtmlEntities(titleMatch[1].trim());
    }

    // Strip non-content blocks
    let clean = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
      .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, ' ')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ');

    // Convert block elements to newlines
    clean = clean
      .replace(/<\/(p|div|h[1-6]|li|tr|blockquote|article|section)>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n');

    // Remove remaining HTML tags
    clean = clean.replace(/<[^>]+>/g, ' ');

    // Decode HTML entities
    clean = this.decodeHtmlEntities(clean);

    // Normalize whitespace
    clean = clean
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter((line) => line.length > 0)
      .join('\n\n');

    return { title, text: clean };
  }

  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#([0-9]{1,6});/gi, (_, num) => String.fromCharCode(parseInt(num, 10)));
  }
}
