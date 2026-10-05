import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { MockLlmProvider } from '../src/ai/providers/mock-llm.provider';

describe('Legal Document RAG Assistant E2E & Security Tests', () => {
  let app: INestApplication;
  let adminToken: string;
  let mockLlmProvider: MockLlmProvider;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new GlobalHttpExceptionFilter());

    mockLlmProvider = moduleFixture.get<MockLlmProvider>(MockLlmProvider);

    await app.init();

    // Authenticate admin to obtain JWT
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@legalrag.vn',
        password: 'AdminPassword123!',
      });

    adminToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Health & Infrastructure Verification', () => {
    it('GET /api/health should verify API, PostgreSQL, pgvector, and Redis are UP', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(res.body.status).toBe('ok');
      expect(res.body.services.api).toBe('up');
      expect(res.body.services.database).toBe('up');
      expect(res.body.services.pgvector).toBe('up');
      expect(res.body.services.redis).toBe('up');
    });
  });

  describe('2. Authentication & Authorization Security', () => {
    it('POST /api/auth/login should reject invalid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@legalrag.vn',
          password: 'WrongPassword999!',
        })
        .expect(401);

      expect(res.body.message).toContain('Email hoặc mật khẩu không chính xác');
    });

    it('Protected endpoints should reject requests without JWT', async () => {
      await request(app.getHttpServer())
        .post('/api/documents/url')
        .send({ url: 'https://example.com' })
        .expect(401);

      await request(app.getHttpServer())
        .post('/api/documents/text')
        .send({ title: 'Test', content: 'Nội dung' })
        .expect(401);
    });

    it('Protected endpoints should reject invalid/forged JWT', async () => {
      await request(app.getHttpServer())
        .post('/api/documents/text')
        .set('Authorization', 'Bearer invalid-forged-token-signature')
        .send({ title: 'Test', content: 'Nội dung' })
        .expect(401);
    });

    it('GET /api/auth/me should return admin profile with valid JWT', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.email).toBe('admin@legalrag.vn');
      expect(res.body.role).toBe('ADMIN');
    });
  });

  describe('3. SSRF Protection Tests', () => {
    it('should reject localhost URL ingestion', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/documents/url')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ url: 'http://localhost:3000/internal-secret' })
        .expect(400);

      expect(res.body.message).toContain('bị từ chối vì lý do bảo mật');
    });

    it('should reject loopback 127.0.0.1 URL ingestion', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/documents/url')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ url: 'http://127.0.0.1:8080/admin' })
        .expect(400);

      expect(res.body.message).toContain('không được phép truy cập');
    });

    it('should reject private IP URL ingestion (10.0.0.0/8, 192.168.1.1)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/documents/url')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ url: 'http://10.0.0.1/private-api' })
        .expect(400);

      expect(res.body.message).toContain('không được phép truy cập');
    });

    it('should reject AWS / cloud metadata endpoint (169.254.169.254)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/documents/url')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ url: 'http://169.254.169.254/latest/meta-data/' })
        .expect(400);

      expect(res.body.message).toContain('không được phép truy cập');
    });
  });

  describe('4. File Upload & Input Security Tests', () => {
    it('should reject disallowed file extensions/MIME types (.exe)', async () => {
      await request(app.getHttpServer())
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from('binary-executable-content'), 'malicious.exe')
        .expect(400);
    });

    it('should prevent SQL injection attempts in search queries', async () => {
      const sqlInjectionQuery = "' OR '1'='1' -- ";
      const res = await request(app.getHttpServer())
        .get(`/api/documents?search=${encodeURIComponent(sqlInjectionQuery)}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('5. RAG Pipeline & Grounded Citation Verification', () => {
    it('POST /api/rag/query should answer legal questions with verified citations', async () => {
      const question =
        'Doanh nghiệp cần thực hiện nghĩa vụ gì theo quy định về hồ sơ này và thời hạn thông báo sự cố là bao lâu?';

      const res = await request(app.getHttpServer())
        .post('/api/rag/query')
        .send({ question })
        .expect(200);

      expect(res.body).toHaveProperty('answer');
      expect(res.body).toHaveProperty('citations');
      expect(res.body.citations.length).toBeGreaterThanOrEqual(1);

      const firstCitation = res.body.citations[0];
      expect(firstCitation.verified).toBe(true);
      expect(firstCitation).toHaveProperty('documentTitle');
      expect(firstCitation).toHaveProperty('quote');
    });

    it('Backend should PURGE fake or hallucinated citations from LLM', async () => {
      // Temporarily tell Mock LLM to inject a fake citation
      mockLlmProvider.injectedFakeCitation = true;

      try {
        const res = await request(app.getHttpServer())
          .post('/api/rag/query')
          .send({
            question: 'Thời hạn thông báo sự cố là bao lâu?',
          })
          .expect(200);

        // The fake citation (fake-chunk-id-never-retrieved-999) must be purged by backend validator
        const fakeCitation = res.body.citations.find(
          (c: any) => c.citationId === 'fake-chunk-id-never-retrieved-999',
        );
        expect(fakeCitation).toBeUndefined();

        // Authentic citation must still be present
        expect(res.body.citations.length).toBeGreaterThanOrEqual(1);
      } finally {
        mockLlmProvider.injectedFakeCitation = false;
      }
    });

    it('POST /api/rag/query should return low confidence when context is insufficient', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/rag/query')
        .send({
          question: 'Quy định về việc phóng tên lửa vào không gian vũ trụ và khai thác mặt trăng?',
        })
        .expect(200);

      expect(res.body.insufficientContext).toBe(true);
      expect(res.body.confidence).toBe('low');
      expect(res.body.answer).toContain('Chưa tìm thấy đủ căn cứ pháp lý');
    });
  });

  describe('6. Chat Sessions & History Persistence', () => {
    it('should create session, ask question, persist messages and citations, and reload', async () => {
      // Create session
      const sessionRes = await request(app.getHttpServer())
        .post('/api/chat/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Phiên hỏi đáp kiểm thử' })
        .expect(201);

      const sessionId = sessionRes.body.id;
      expect(sessionId).toBeDefined();

      // Send message
      const msgRes = await request(app.getHttpServer())
        .post(`/api/chat/sessions/${sessionId}/messages`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: 'Điều khoản nào quy định thời hạn thực hiện thông báo khi có sự cố?',
        })
        .expect(200);

      expect(msgRes.body.message.role).toBe('assistant');
      expect(msgRes.body.message.citations.length).toBeGreaterThanOrEqual(1);

      // Reload session to verify database persistence
      const getSessionRes = await request(app.getHttpServer())
        .get(`/api/chat/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(getSessionRes.body.messages.length).toBe(2); // user + assistant
      const persistedAssistantMsg = getSessionRes.body.messages[1];
      expect(persistedAssistantMsg.role).toBe('assistant');
      expect(persistedAssistantMsg.citations.length).toBeGreaterThanOrEqual(1);
      expect(persistedAssistantMsg.citations[0].verified).toBe(true);
    });
  });
});
