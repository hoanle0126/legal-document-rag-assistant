import { PrismaClient, Role, LegalDocumentType, IngestionStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { LegalParserService } from '../src/documents/legal-parser/legal-parser.service';
import { LegalChunkerService } from '../src/documents/chunker/legal-chunker.service';
import { MockEmbeddingProvider } from '../src/ai/providers/mock-embedding.provider';

const prisma = new PrismaClient();
const parser = new LegalParserService();
const chunker = new LegalChunkerService();
const embeddingProvider = new MockEmbeddingProvider();

const SAMPLE_DOCS = [
  {
    title: '[DEMO] Nghị định số 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân trong hoạt động doanh nghiệp',
    documentNumber: '13/2023/NĐ-CP',
    documentType: 'DECREE' as LegalDocumentType,
    issuingAuthority: 'Chính phủ',
    publishedAt: new Date('2023-04-17'),
    effectiveAt: new Date('2023-07-01'),
    content: `NGHỊ ĐỊNH
Quy định về bảo vệ dữ liệu cá nhân

Chương I
QUY ĐỊNH CHUNG

Điều 1. Phạm vi điều chỉnh
1. Nghị định này quy định về bảo vệ dữ liệu cá nhân và trách nhiệm bảo vệ dữ liệu cá nhân của cơ quan, tổ chức, doanh nghiệp, cá nhân có liên quan.
2. Nghị định này áp dụng đối với cơ quan, tổ chức, cá nhân Việt Nam; cơ quan, tổ chức, cá nhân nước ngoài tại Việt Nam.

Điều 2. Giải thích từ ngữ
1. Dữ liệu cá nhân là thông tin dưới dạng ký hiệu, chữ viết, chữ số, hình ảnh, âm thanh hoặc dạng tương tự trên môi trường điện tử gắn liền với một con người cụ thể.
2. Xử lý dữ liệu cá nhân là một hoặc nhiều hoạt động tác động tới dữ liệu cá nhân, như: thu thập, ghi, phân tích, lưu trữ, chỉnh sửa, công khai, kết hợp, truy cập, truy xuất, thu hồi, mã hóa, giải mã, sao chép, chia sẻ, truyền đưa, cung cấp, chuyển giao, xóa, hủy dữ liệu cá nhân.

Điều 3. Nguyên tắc bảo vệ dữ liệu cá nhân
1. Dữ liệu cá nhân được xử lý theo quy định của pháp luật.
2. Chủ thể dữ liệu được biết về hoạt động liên quan tới xử lý dữ liệu cá nhân của mình, trừ trường hợp luật có quy định khác.

Chương II
QUYỀN VÀ NGHĨA VỤ CỦA CHỦ THỂ DỮ LIỆU VÀ DOANH NGHIỆP

Điều 9. Quyền của chủ thể dữ liệu
1. Quyền được biết: Chủ thể dữ liệu được biết về hoạt động xử lý dữ liệu cá nhân của mình.
2. Quyền đồng ý: Chủ thể dữ liệu được đồng ý hoặc không đồng ý cho phép xử lý dữ liệu cá nhân của mình.
3. Quyền xóa dữ liệu: Chủ thể dữ liệu được yêu cầu xóa hoặc tự xóa dữ liệu cá nhân của mình.

Điều 12. Biện pháp bảo vệ dữ liệu cá nhân của Doanh nghiệp
1. Doanh nghiệp xử lý dữ liệu cá nhân phải áp dụng các biện pháp quản lý và kỹ thuật phù hợp để bảo vệ dữ liệu cá nhân, ngăn chặn hành vi vi phạm quy định pháp luật.
2. Biện pháp quản lý bao gồm việc ban hành quy chế nội bộ về bảo vệ dữ liệu cá nhân; phân công bộ phận hoặc nhân sự chuyên trách bảo vệ dữ liệu cá nhân (DPO).
3. Thời hạn thông báo vi phạm quy định về bảo vệ dữ liệu cá nhân: Trong thời hạn 72 giờ kể từ khi phát hiện hành vi vi phạm hoặc sự cố lộ lọt dữ liệu, doanh nghiệp phải thông báo bằng văn bản cho Cục An ninh mạng và phòng, chống tội phạm sử dụng công nghệ cao (Bộ Công an).

Chương III
ĐIỀU KIỆN MIỄN TRỪ VÀ TRƯỜNG HỢP ĐẶC BIỆT

Điều 17. Trường hợp miễn áp dụng một số nghĩa vụ
1. Doanh nghiệp siêu nhỏ, doanh nghiệp nhỏ, doanh nghiệp khởi nghiệp được quyền lựa chọn miễn trừ quy định về chỉ định bộ phận hoặc nhân sự chuyên trách bảo vệ dữ liệu cá nhân trong thời hạn 02 năm kể từ ngày thành lập doanh nghiệp.
2. Quy định miễn trừ tại Khoản 1 Điều này không áp dụng đối với các doanh nghiệp trực tiếp hoạt động kinh doanh xử lý dữ liệu cá nhân.`,
  },
  {
    title: '[DEMO] Luật Giao dịch điện tử số 20/2023/QH15 về Chữ ký số và Hợp đồng điện tử',
    documentNumber: '20/2023/QH15',
    documentType: 'LAW' as LegalDocumentType,
    issuingAuthority: 'Quốc hội',
    publishedAt: new Date('2023-06-22'),
    effectiveAt: new Date('2024-07-01'),
    content: `LUẬT
Giao dịch điện tử

Chương I
QUY ĐỊNH CHUNG

Điều 1. Phạm vi điều chỉnh
1. Luật này quy định về thực hiện giao dịch bằng phương tiện điện tử.
2. Luật này không quy định về nội dung, điều kiện, hình thức của giao dịch quy định tại luật khác.

Điều 5. Giá trị pháp lý của thông điệp dữ liệu
1. Thông tin trong thông điệp dữ liệu không bị phủ nhận giá trị pháp lý chỉ vì thông tin đó được thể hiện dưới dạng thông điệp dữ liệu.
2. Thông điệp dữ liệu có giá trị như văn bản giấy khi thông tin trong thông điệp dữ liệu đó có thể truy cập và sử dụng được để tham chiếu khi cần thiết.

Chương II
CHỮ KÝ ĐIỆN TỬ VÀ CHỮ KÝ SỐ

Điều 22. Phân loại chữ ký điện tử
1. Chữ ký điện tử chuyên dùng là chữ ký điện tử do cơ quan, tổ chức tạo lập, sử dụng riêng cho hoạt động của mình.
2. Chữ ký số là chữ ký điện tử sử dụng thuật toán khóa không đối xứng, gồm khóa bí mật và khóa công khai.

Điều 23. Giá trị pháp lý của chữ ký điện tử trong giao dịch
1. Chữ ký điện tử không bị phủ nhận giá trị pháp lý chỉ vì được thể hiện dưới dạng điện tử.
2. Chữ ký điện tử chuyên dùng bảo đảm an toàn hoặc chữ ký số có giá trị pháp lý tương đương chữ ký của cá nhân trong văn bản giấy.
3. Trường hợp pháp luật quy định văn bản phải được cơ quan, tổ chức xác nhận thì chữ ký số của cơ quan, tổ chức đó có giá trị pháp lý tương đương con dấu.

Chương III
KẾT GIAO VÀ THỰC HIỆN HỢP ĐỒNG ĐIỆN TỬ

Điều 34. Nguyên tắc giao kết và thực hiện hợp đồng điện tử
1. Các bên có quyền thỏa thuận sử dụng thông điệp dữ liệu, phương tiện điện tử một phần hoặc toàn bộ trong giao kết và thực hiện hợp đồng điện tử.
2. Thời hạn gửi và nhận thông điệp dữ liệu được xác định theo thời điểm thông điệp dữ liệu rời khỏi hoặc đi vào hệ thống thông tin của người nhận.`,
  },
  {
    title: '[DEMO] Thông tư số 09/2024/TT-BTTTT Quy chuẩn kỹ thuật bảo đảm an toàn hệ thống thông tin cấp độ 3',
    documentNumber: '09/2024/TT-BTTTT',
    documentType: 'CIRCULAR' as LegalDocumentType,
    issuingAuthority: 'Bộ Thông tin và Truyền thông',
    publishedAt: new Date('2024-05-10'),
    effectiveAt: new Date('2024-09-15'),
    content: `THÔNG TƯ
Quy định quy chuẩn kỹ thuật an toàn thông tin theo cấp độ

Chương I
QUY ĐỊNH CHUNG

Điều 1. Phạm vi điều chỉnh và đối tượng áp dụng
1. Thông tư này quy định yêu cầu kỹ thuật tối thiểu đối với hệ thống thông tin cấp độ 3 của các tổ chức, doanh nghiệp cung cấp dịch vụ trực tuyến.
2. Áp dụng đối với cơ quan nhà nước, doanh nghiệp viễn thông, doanh nghiệp cung cấp dịch vụ công nghệ thông tin.

Điều 4. Yêu cầu bảo đảm an toàn sao lưu dự phòng
1. Dữ liệu nghiệp vụ quan trọng phải được sao lưu tự động hàng ngày (daily backup) và lưu trữ phân tán tại địa điểm tách biệt vật lý.
2. Thời hạn lưu trữ dữ liệu sao lưu tối thiểu là 01 năm; dữ liệu nhật ký hệ thống (log) phải lưu trữ tối thiểu 06 tháng phục vụ điều tra sự cố.

Điều 8. Trường hợp miễn kiểm toán an toàn thông tin định kỳ
1. Hệ thống thông tin nội bộ không kết nối Internet và không lưu trữ thông tin nhạy cảm của khách hàng được miễn thực hiện kiểm toán độc lập định kỳ hằng năm.
2. Đơn vị vận hành hệ thống tại Khoản 1 Điều này phải tự đánh giá an toàn thông tin tối thiểu 02 năm một lần.`,
  },
];

async function main() {
  console.log('🌱 Starting Database Seeding...');

  // 1. Seed Admin User
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@legalrag.vn';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, name: 'Legal Tech Admin', role: Role.ADMIN },
    create: {
      email: adminEmail,
      name: 'Legal Tech Admin',
      passwordHash,
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Admin user seeded: ${admin.email}`);

  // 2. Seed Sample Legal Documents
  for (const docData of SAMPLE_DOCS) {
    const rawContent = docData.content.trim();
    const checksum = crypto.createHash('sha256').update(rawContent).digest('hex');

    // Check if doc already exists
    const existing = await prisma.document.findFirst({
      where: { documentNumber: docData.documentNumber },
    });

    if (existing) {
      console.log(`ℹ️ Document ${docData.documentNumber} already exists. Skipping.`);
      continue;
    }

    const doc = await prisma.document.create({
      data: {
        title: docData.title,
        documentNumber: docData.documentNumber,
        documentType: docData.documentType,
        issuingAuthority: docData.issuingAuthority,
        publishedAt: docData.publishedAt,
        effectiveAt: docData.effectiveAt,
        status: IngestionStatus.PROCESSING,
      },
    });

    const version = await prisma.documentVersion.create({
      data: {
        documentId: doc.id,
        version: 1,
        checksum,
        rawText: rawContent,
        sourceType: 'MANUAL',
        pageCount: 1,
      },
    });

    const job = await prisma.ingestionJob.create({
      data: {
        documentId: doc.id,
        status: 'PROCESSING',
        sourceType: 'MANUAL',
        startedAt: new Date(),
      },
    });

    // Parse legal document
    const parsed = parser.parse(rawContent, {
      title: docData.title,
      documentNumber: docData.documentNumber,
      documentType: docData.documentType,
      issuingAuthority: docData.issuingAuthority,
    });

    // Save nodes recursively
    async function saveNodes(nodes: any[], parentId: string | null) {
      for (const node of nodes) {
        const created = await prisma.legalNode.create({
          data: {
            documentVersionId: version.id,
            parentId,
            type: node.type,
            number: node.number,
            title: node.title,
            content: node.content,
            originalText: node.originalText,
            hierarchyPath: node.hierarchyPath,
            page: node.page,
            orderIndex: node.orderIndex,
          },
        });
        node.id = created.id;
        if (node.children && node.children.length > 0) {
          await saveNodes(node.children, created.id);
        }
      }
    }
    await saveNodes(parsed.rootNodes, null);

    // Chunk
    const chunks = chunker.chunkDocument(parsed.rootNodes, {
      documentId: doc.id,
      documentTitle: doc.title,
      documentNumber: doc.documentNumber || undefined,
      documentType: doc.documentType,
      issuingAuthority: doc.issuingAuthority || undefined,
      versionId: version.id,
    });

    // Embed and insert
    const embeddings = await embeddingProvider.embedDocuments(chunks.map((c) => c.content));
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      const emb = embeddings[i];

      const createdChunk = await prisma.documentChunk.create({
        data: {
          documentVersionId: version.id,
          legalNodeId: c.legalNodeId,
          content: c.content,
          tokenCount: c.tokenCount,
          article: c.article,
          clause: c.clause,
          point: c.point,
          page: c.page,
          hierarchyPath: c.hierarchyPath,
          metadata: c.metadata as any,
        },
      });

      const vectorStr = `[${emb.join(',')}]`;
      await prisma.$executeRaw`
        UPDATE "document_chunks"
        SET "embedding" = ${vectorStr}::vector
        WHERE "id" = ${createdChunk.id}
      `;
    }

    await prisma.document.update({
      where: { id: doc.id },
      data: { status: IngestionStatus.INDEXED },
    });

    await prisma.ingestionJob.update({
      where: { id: job.id },
      data: {
        status: IngestionStatus.INDEXED,
        chunksCount: chunks.length,
        completedAt: new Date(),
      },
    });

    console.log(`✅ Seeded Document: ${doc.title} (${chunks.length} chunks indexed)`);
  }

  // 3. Seed Initial Demo Chat Session with verified citations
  const existingSession = await prisma.chatSession.findFirst();
  if (!existingSession) {
    const session = await prisma.chatSession.create({
      data: {
        userId: admin.id,
        title: 'Tra cứu nghĩa vụ doanh nghiệp theo Nghị định 13/2023/NĐ-CP',
      },
    });

    const userMsg = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content: 'Doanh nghiệp cần thực hiện nghĩa vụ gì theo quy định về hồ sơ này và thời hạn thông báo sự cố là bao lâu?',
      },
    });

    // Find relevant chunk
    const chunk = await prisma.documentChunk.findFirst({
      where: { article: '12' },
    });

    const assistantMsg = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: `Căn cứ theo quy định tại Nghị định số 13/2023/NĐ-CP (Điều 12, Khoản 2, Khoản 3): [1]\n\nDoanh nghiệp xử lý dữ liệu cá nhân có các nghĩa vụ trọng tâm sau:\n1. Biện pháp quản lý: Ban hành quy chế nội bộ về bảo vệ dữ liệu cá nhân; phân công bộ phận hoặc nhân sự chuyên trách bảo vệ dữ liệu cá nhân (DPO).\n2. Thời hạn thông báo vi phạm: Trong thời hạn 72 giờ kể từ khi phát hiện hành vi vi phạm hoặc sự cố lộ lọt dữ liệu, doanh nghiệp phải thông báo bằng văn bản cho Cục An ninh mạng và phòng, chống tội phạm sử dụng công nghệ cao (Bộ Công an).`,
        confidence: 'high',
        insufficientContext: false,
        provider: 'mock-llm+mock-embedding',
        executionTimeMs: 145,
      },
    });

    if (chunk) {
      await prisma.retrievedCitation.create({
        data: {
          messageId: assistantMsg.id,
          chunkId: chunk.id,
          citationIndex: 1,
          documentTitle: 'Nghị định số 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân trong hoạt động doanh nghiệp',
          documentNumber: '13/2023/NĐ-CP',
          article: '12',
          clause: '2, 3',
          quote: 'Biện pháp quản lý bao gồm việc ban hành quy chế nội bộ về bảo vệ dữ liệu cá nhân; phân công bộ phận hoặc nhân sự chuyên trách bảo vệ dữ liệu cá nhân (DPO). Thời hạn thông báo vi phạm: Trong thời hạn 72 giờ...',
          verified: true,
          hierarchyPath: 'Chương II > Điều 12 > Khoản 2',
        },
      });
    }

    console.log(`✅ Seeded Demo Chat Session: ${session.title}`);
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
