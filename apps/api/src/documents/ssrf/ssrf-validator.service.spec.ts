import { SsrfValidatorService } from './ssrf-validator.service';
import { BadRequestException } from '@nestjs/common';

describe('SsrfValidatorService', () => {
  let ssrfValidator: SsrfValidatorService;

  beforeEach(() => {
    ssrfValidator = new SsrfValidatorService();
  });

  it('should reject localhost', async () => {
    await expect(ssrfValidator.validateUrl('http://localhost:8080/secret')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should reject loopback 127.0.0.1', async () => {
    await expect(ssrfValidator.validateUrl('http://127.0.0.1:3000')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should reject private IP ranges (10.0.0.0/8, 192.168.0.0/16)', async () => {
    await expect(ssrfValidator.validateUrl('http://10.0.0.5/api')).rejects.toThrow(
      BadRequestException,
    );
    await expect(ssrfValidator.validateUrl('http://192.168.1.1/admin')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should reject AWS / cloud metadata endpoints', async () => {
    await expect(
      ssrfValidator.validateUrl('http://169.254.169.254/latest/meta-data/'),
    ).rejects.toThrow(BadRequestException);
    await expect(
      ssrfValidator.validateUrl('http://metadata.google.internal/computeMetadata/v1/'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject non-HTTP/HTTPS protocols', async () => {
    await expect(ssrfValidator.validateUrl('ftp://example.com/file.txt')).rejects.toThrow(
      BadRequestException,
    );
    await expect(ssrfValidator.validateUrl('file:///etc/passwd')).rejects.toThrow(
      BadRequestException,
    );
  });
});
