export const LEGAL_PATTERNS = {
  // Phần I, Phần thứ nhất, PHẦN THỨ HAI
  PART: /^(?:PHẦN|Phần)\s+(?:THỨ\s+)?([IVXLCDM0-9]+|[A-ZÀ-Ỹa-zà-ỹ\s]+)(?:[\.\:\-—]\s*(.*))?$/i,

  // Chương I, CHƯƠNG 1, Chương I: TÊN CHƯƠNG
  CHAPTER: /^(?:CHƯƠNG|Chương)\s+([IVXLCDM0-9]+)(?:[\.\:\-—]\s*(.*))?$/i,

  // Mục 1, MỤC 1. TÊN MỤC
  SECTION: /^(?:MỤC|Mục)\s+([0-9]+|[IVXLCDM]+)(?:[\.\:\-—]\s*(.*))?$/i,

  // Tiểu mục 1
  SUBSECTION: /^(?:TIỂU\s+MỤC|Tiểu\s+mục)\s+([0-9]+|[IVXLCDM]+)(?:[\.\:\-—]\s*(.*))?$/i,

  // Điều 1. Tên điều, Điều 12: ..., ĐIỀU 1.
  ARTICLE: /^(?:ĐIỀU|Điều)\s+([0-9]+)(?:[\.\:\-—]\s*(.*))?$/i,

  // Khoản 1. hoặc 1. hoặc 1)
  CLAUSE: /^(?:(?:Khoản|KHOẢN)\s+([0-9]+)[\.\:\-—]?\s*(.*)|([0-9]+)[\.\)]\s+(.*))$/i,

  // Điểm a) hoặc a) hoặc a.
  POINT: /^(?:(?:Điểm|ĐIỂM)\s+([a-zđ])[\.\:\)]?\s*(.*)|([a-zđ])[\.\)]\s+(.*))$/i,
};

export const VIETNAMESE_LEGAL_DISCLAIMER =
  'Lưu ý: Trợ lý AI pháp lý chỉ phục vụ mục đích nghiên cứu, tra cứu và tham khảo căn cứ quy định. Nội dung phản hồi không cấu thành ý kiến tư vấn pháp lý chính thức. Vui lòng đối chiếu với văn bản pháp luật gốc kèm trích dẫn chi tiết.';

export const INSUFFICIENT_CONTEXT_MESSAGE =
  'Chưa tìm thấy đủ căn cứ pháp lý trong các tài liệu hiện có trong hệ thống để đưa ra kết luận chắc chắn. Vui lòng bổ sung văn bản quy phạm liên quan hoặc làm rõ nội dung câu hỏi.';

export const LEGAL_DOCUMENT_TYPE_LABELS: Record<string, string> = {
  LAW: 'Luật / Bộ luật',
  DECREE: 'Nghị định',
  CIRCULAR: 'Thông tư',
  DECISION: 'Quyết định',
  REGULATION: 'Quy chế / Quy chuẩn',
  RESOLUTION: 'Nghị quyết',
  ORDER: 'Lệnh',
  DIRECTIVE: 'Chỉ thị',
  OTHER: 'Văn bản khác',
};

export const INGESTION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  PROCESSING: 'Đang trích xuất & nhúng',
  INDEXED: 'Đã đánh chỉ mục',
  FAILED: 'Xử lý thất bại',
};
