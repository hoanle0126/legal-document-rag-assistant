import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as dns from 'dns/promises';
import * as ipaddr from 'ipaddr.js';

@Injectable()
export class SsrfValidatorService {
  private readonly logger = new Logger(SsrfValidatorService.name);

  private readonly blockedHostnames = new Set([
    'localhost',
    'localhost.localdomain',
    'metadata.google.internal',
    'metadata.internal',
    'instance-data',
  ]);

  private readonly blockedTLDs = ['.local', '.internal', '.corp', '.home', '.lan', '.arpa'];

  /**
   * Validates a URL against SSRF vulnerabilities.
   * Resolves DNS and checks that IP does not belong to private/reserved ranges.
   */
  async validateUrl(urlString: string): Promise<URL> {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(urlString);
    } catch {
      throw new BadRequestException('URL không hợp lệ.');
    }

    // 1. Enforce strict HTTP/HTTPS protocol
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new BadRequestException('Chỉ hỗ trợ giao thức HTTP và HTTPS.');
    }

    const hostname = parsedUrl.hostname.toLowerCase().trim();

    // 2. Reject explicit banned hostnames or internal TLDs
    if (this.blockedHostnames.has(hostname)) {
      throw new BadRequestException(`Truy cập máy chủ nội bộ (${hostname}) bị từ chối vì lý do bảo mật.`);
    }

    for (const tld of this.blockedTLDs) {
      if (hostname.endsWith(tld)) {
        throw new BadRequestException(`Tên miền nội bộ (${hostname}) không được phép.`);
      }
    }

    // 3. If hostname is directly an IP, parse and validate
    if (ipaddr.isValid(hostname)) {
      this.assertPublicIp(hostname);
      return parsedUrl;
    }

    // 4. Resolve DNS to verify all associated IP addresses
    try {
      const lookupResults = await dns.lookup(hostname, { all: true });
      if (!lookupResults || lookupResults.length === 0) {
        throw new BadRequestException(`Không thể phân giải tên miền: ${hostname}`);
      }

      for (const record of lookupResults) {
        this.assertPublicIp(record.address);
      }
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      this.logger.warn(`Lỗi phân giải DNS cho hostname ${hostname}: ${err.message}`);
      throw new BadRequestException(`Không thể kết nối hoặc phân giải tên miền: ${hostname}`);
    }

    return parsedUrl;
  }

  /**
   * Verifies that an IP string does not belong to private, loopback, or metadata ranges.
   */
  assertPublicIp(ipString: string): void {
    if (!ipaddr.isValid(ipString)) {
      throw new BadRequestException(`Địa chỉ IP không hợp lệ: ${ipString}`);
    }

    const addr = ipaddr.parse(ipString);
    let range: string;

    if (addr.kind() === 'ipv4') {
      range = addr.range();
    } else {
      // IPv6 - check if IPv4-mapped (e.g. ::ffff:127.0.0.1)
      const v6 = addr as ipaddr.IPv6;
      if (v6.isIPv4MappedAddress()) {
        range = v6.toIPv4Address().range();
      } else {
        range = v6.range();
      }
    }

    const forbiddenRanges = [
      'loopback',
      'private',
      'linkLocal',
      'carrierGradeNat',
      'broadcast',
      'reserved',
      'unspecified',
      'uniqueLocal',
    ];

    if (forbiddenRanges.includes(range)) {
      this.logger.warn(`Chặn SSRF: IP ${ipString} thuộc dải bị cấm (${range})`);
      throw new BadRequestException(
        `Địa chỉ IP đích (${ipString}) thuộc mạng nội bộ hoặc dải địa chỉ bảo lưu không được phép truy cập.`,
      );
    }

    // Explicit check for AWS/GCP/Azure link-local metadata IP (169.254.169.254)
    if (ipString === '169.254.169.254' || ipString === '::ffff:169.254.169.254') {
      throw new BadRequestException('Truy cập endpoint metadata đám mây bị từ chối.');
    }
  }
}
