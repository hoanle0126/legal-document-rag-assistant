'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfidenceBadge } from '@/components/legal/ConfidenceBadge';
import { CitationBadge } from '@/components/legal/CitationBadge';
import { SourceVerificationDrawer } from '@/components/legal/SourceVerificationDrawer';
import { api } from '@/lib/api';
import { RetrievedCitation } from '@legal-rag/shared';
import {
  Scale,
  Send,
  Plus,
  Trash2,
  BookOpen,
  Shield,
  Clock,
  Layers,
  ChevronRight,
  FileCheck2,
  Search,
  Bookmark,
  Gavel,
} from 'lucide-react';

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  confidence?: 'high' | 'medium' | 'low';
  insufficientContext?: boolean;
  citations?: RetrievedCitation[];
  createdAt?: string;
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
  _count?: { messages: number };
}

function AssistantContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q');
  const initialDocId = searchParams.get('docId');

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState(initialQuery || '');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<RetrievedCitation | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sampleDossiers = [
    {
      docket: 'ND13-DK01',
      title: 'Thời hạn thông báo sự cố dữ liệu cá nhân',
      query: 'Thời hạn bên xử lý dữ liệu phải lập biên bản và thông báo sự cố vi phạm quy định bảo vệ dữ liệu cá nhân cho Bộ Công an theo Nghị định 13/2023?',
      statute: 'Nghị định 13/2023/NĐ-CP (Điều 23)',
    },
    {
      docket: 'ND13-DK02',
      title: 'Điều kiện miễn trừ chỉ định nhân sự DPO',
      query: 'Trường hợp doanh nghiệp siêu nhỏ, doanh nghiệp vừa và nhỏ nào được quyền lựa chọn miễn trừ chỉ định bộ phận hoặc nhân sự chuyên trách bảo vệ dữ liệu cá nhân?',
      statute: 'Nghị định 13/2023/NĐ-CP (Điều 28)',
    },
    {
      docket: 'LGD23-DK01',
      title: 'Giá trị pháp lý của chữ ký điện tử & chữ ký số',
      query: 'Điều kiện công nhận và giá trị pháp lý của chữ ký điện tử an toàn hoặc chữ ký số chuyên dùng theo Luật Giao dịch điện tử 2023?',
      statute: 'Luật 20/2023/QH15 (Điều 22, 23)',
    },
    {
      docket: 'TT09-DK01',
      title: 'Miễn kiểm toán định kỳ an toàn thông tin',
      query: 'Hệ thống thông tin cấp độ nào và đối tượng nào được miễn kiểm toán định kỳ an toàn thông tin theo Thông tư 09/2024/TT-BTTTT?',
      statute: 'Thông tư 09/2024/TT-BTTTT (Điều 8)',
    },
  ];

  // 1. Load Sessions
  const loadSessions = async () => {
    try {
      const data = await api.chat.listSessions();
      setSessions(data || []);
      if (data && data.length > 0 && !activeSessionId) {
        setActiveSessionId(data[0].id);
      }
    } catch (err) {
      console.error('Lỗi nạp danh mục phiên khảo sát:', err);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // 2. Load Messages for Active Session
  useEffect(() => {
    async function loadActiveSessionMessages() {
      if (!activeSessionId) {
        setMessages([]);
        return;
      }

      try {
        const session = await api.chat.getSession(activeSessionId);
        if (session && session.messages) {
          setMessages(
            session.messages.map((m: any) => ({
              id: m.id,
              role: m.role.toLowerCase() as any,
              content: m.content,
              confidence: m.confidence?.toLowerCase() || 'medium',
              citations: m.citations || [],
              createdAt: m.createdAt,
            })),
          );
        }
      } catch (err) {
        console.error('Lỗi nạp hồ sơ phiên:', err);
      }
    }

    loadActiveSessionMessages();
  }, [activeSessionId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Create new session
  const handleNewSession = async () => {
    try {
      const newSession = await api.chat.createSession('Hồ sơ Tra cứu Mới');
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setMessages([]);
    } catch (err: any) {
      console.error('Lỗi khởi tạo phiên:', err);
    }
  };

  // Delete session
  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm('Xác nhận xóa hồ sơ tra cứu pháp lý này khỏi sổ lưu chiểu?')) return;

    try {
      await api.chat.deleteSession(sessionId);
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);
      if (activeSessionId === sessionId) {
        setActiveSessionId(remaining[0]?.id || null);
      }
    } catch (err: any) {
      console.error('Lỗi xóa hồ sơ:', err);
    }
  };

  // Send message
  const handleSendMessage = async (queryToSend?: string) => {
    const query = (queryToSend || inputQuery).trim();
    if (!query || isLoading) return;

    setInputQuery('');

    let sessionId = activeSessionId;
    if (!sessionId) {
      try {
        const newSession = await api.chat.createSession(
          query.slice(0, 36) + (query.length > 36 ? '...' : ''),
        );
        setSessions((prev) => [newSession, ...prev]);
        sessionId = newSession.id;
        setActiveSessionId(sessionId);
      } catch (err: any) {
        console.error('Lỗi lập phiên mới:', err);
        return;
      }
    }

    const userMsg: ChatMessage = {
      role: 'user',
      content: query,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.chat.sendMessage(sessionId, {
        content: query,
      });

      const assistantMsg: ChatMessage = {
        id: res.message.id,
        role: 'assistant',
        content: res.message.content,
        confidence: res.message.confidence?.toLowerCase() || 'high',
        citations: res.message.citations || [],
        createdAt: res.message.createdAt,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      loadSessions();
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: `Đã xảy ra sự cố trong quá trình đối soát văn bản quy phạm: ${err.message || 'Lỗi kết nối máy chủ'}`,
        confidence: 'low',
        insufficientContext: true,
        citations: [],
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCitation = (citation: RetrievedCitation) => {
    setSelectedCitation(citation);
    setIsDrawerOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-parchment-50">
      <Header
        title="Bàn Nghiên Cứu & Trưng Cầu Căn Cứ Pháp Lý"
        subtitle="Hệ thống đối chiếu quy phạm, bảo tồn thứ bậc điều khoản và đối soát trích lục nguyên bản"
      />

      {/* Main Container */}
      <div className="flex-1 flex min-h-0 max-w-7xl mx-auto w-full p-4 md:p-6 gap-6">
        {/* Dossier Sessions Index (Left Archival Ledger) */}
        <div className="w-80 bg-parchment-100 rounded-lg border border-hairline flex flex-col shrink-0 overflow-hidden shadow-subtle hidden md:flex">
          <div className="p-3.5 border-b border-hairline bg-parchment-200/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="w-3.5 h-3.5 text-obsidian-600" />
              <span className="font-mono text-xs uppercase tracking-wider text-obsidian-800 font-semibold">
                Sổ Lưu Chiểu Khảo Sát
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleNewSession}
              icon={<Plus className="w-3.5 h-3.5" />}
              className="h-7 text-xs px-2.5 font-mono"
            >
              Lập mới
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.length === 0 ? (
              <div className="p-8 text-center text-obsidian-400 text-xs font-serif">
                Chưa có hồ sơ khảo sát nào. Hãy khởi tạo phiên nghiên cứu đầu tiên.
              </div>
            ) : (
              sessions.map((sess, idx) => (
                <div
                  key={sess.id}
                  onClick={() => setActiveSessionId(sess.id)}
                  className={`group flex items-center justify-between p-2.5 rounded text-xs cursor-pointer transition-all border ${
                    sess.id === activeSessionId
                      ? 'bg-white border-obsidian-300 text-obsidian-950 font-medium shadow-subtle'
                      : 'border-transparent text-obsidian-600 hover:bg-parchment-150 hover:text-obsidian-900'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    <span className="font-mono text-[10px] text-obsidian-400 shrink-0">
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    <span className="truncate font-sans">{sess.title}</span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteSession(e, sess.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-100 hover:text-rose-700 text-obsidian-400 transition-opacity"
                    title="Xóa hồ sơ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-hairline bg-parchment-150/70 text-[11px] text-obsidian-600 font-mono flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-sage-600 shrink-0" />
            <span>Mọi căn cứ đều được đối soát trên PostgreSQL</span>
          </div>
        </div>

        {/* Judicial Research Workbench & Memorandum (Right Panel) */}
        <div className="flex-1 bg-white rounded-lg border border-hairline flex flex-col overflow-hidden shadow-subtle min-w-0">
          {/* Memorandum Header */}
          <div className="px-5 py-3.5 border-b border-hairline bg-parchment-100/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-obsidian-900 text-parchment-100 flex items-center justify-center shadow-subtle">
                <Scale className="w-4 h-4 text-gilt-300" />
              </div>
              <div>
                <h3 className="font-serif text-sm font-bold text-obsidian-950 leading-none">
                  Bản Ý Kiến Pháp Lý & Đối Soát Quy Phạm
                </h3>
                <p className="text-[11px] text-sage-700 font-mono mt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sage-600 inline-block" />
                  Hạ tầng Grounded RAG • Neo chính xác vào điều khoản văn bản
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-obsidian-500">
              <span className="hidden sm:inline">Chỉ mục:</span>
              <span className="px-2 py-0.5 rounded bg-parchment-200 border border-hairline text-obsidian-700 font-mono text-[10px]">
                pgvector HNSW (1536-d) + tsvector
              </span>
            </div>
          </div>

          {/* Messages Container (Dossier Format) */}
          <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 bg-parchment-50/40">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6 max-w-2xl mx-auto my-auto">
                <div className="w-14 h-14 rounded-full bg-parchment-150 border border-hairline flex items-center justify-center text-obsidian-700 shadow-subtle">
                  <Gavel className="w-7 h-7 text-obsidian-800" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-serif text-xl font-bold text-obsidian-950">
                    Bàn Nghiên Cứu & Trưng Cầu Căn Cứ Pháp Luật
                  </h2>
                  <p className="text-xs text-obsidian-600 leading-relaxed font-sans max-w-md mx-auto">
                    Hệ thống sẽ tra cứu quy chuẩn phân rã trong các Luật, Nghị định và Thông tư, lập bản ý kiến giải trình và cung cấp trích lục điều khoản nguyên bản để kiểm toán.
                  </p>
                </div>

                {/* Sample Prompt Dossiers */}
                <div className="w-full space-y-2 text-left">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-obsidian-500 block mb-2 font-semibold">
                    HỒ SƠ KHẢO SÁT MẪU ĐÃ ĐƯỢC CHỨNG THỰC:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {sampleDossiers.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(item.query)}
                        className="p-3.5 rounded border border-hairline bg-white hover:border-obsidian-400 hover:bg-parchment-100/60 text-left transition-all group shadow-subtle"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-obsidian-500 mb-1">
                          <span className="px-1.5 py-0.5 rounded bg-obsidian-100 text-obsidian-700">
                            {item.docket}
                          </span>
                          <span className="group-hover:text-obsidian-900 font-medium">Khảo sát →</span>
                        </div>
                        <p className="font-serif text-xs font-semibold text-obsidian-900 group-hover:text-obsidian-950 leading-snug line-clamp-1">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-obsidian-600 mt-1 line-clamp-2 font-sans">
                          "{item.query}"
                        </p>
                        <div className="mt-2 text-[10px] font-mono text-obsidian-400 truncate">
                          {item.statute}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className="space-y-4">
                  {/* USER INQUIRY DOSSIER */}
                  {msg.role === 'user' && (
                    <div className="rounded-lg border border-hairline bg-parchment-150/80 p-4 md:p-5 shadow-subtle">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-hairline text-[11px] font-mono text-obsidian-500">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-obsidian-700 inline-block" />
                          <span className="uppercase tracking-wider font-semibold text-obsidian-800">
                            Yêu Cầu Giải Trình Pháp Lý
                          </span>
                        </div>
                        {msg.createdAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-obsidian-400" />
                            {new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      <div className="font-serif text-sm md:text-[15px] font-medium text-obsidian-950 leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  )}

                  {/* ASSISTANT LEGAL MEMORANDUM & EXECUTED FINDING */}
                  {msg.role === 'assistant' && (
                    <div className="rounded-lg border border-hairline bg-white shadow-subtle overflow-hidden">
                      {/* Legal Memorandum Top Bar */}
                      <div className="px-5 py-3 border-b border-hairline bg-parchment-100/60 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs uppercase tracking-wider font-bold text-obsidian-900 px-2 py-0.5 rounded bg-obsidian-100">
                            Bản Ý Kiến Pháp Lý
                          </span>
                          {msg.confidence && <ConfidenceBadge confidence={msg.confidence} />}
                        </div>

                        {msg.createdAt && (
                          <span className="text-[11px] font-mono text-obsidian-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-obsidian-400" />
                            Lưu chiểu:{' '}
                            {new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        )}
                      </div>

                      {/* Memorandum Content */}
                      <div className="p-5 md:p-6 space-y-4">
                        <div className="font-serif text-sm md:text-[15px] leading-relaxed text-obsidian-950 whitespace-pre-wrap">
                          {msg.content}
                        </div>

                        {/* Statutory Citations Dossier Section */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="pt-4 mt-4 border-t border-hairline bg-parchment-50/70 p-3.5 rounded border border-hairline/80 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono text-[11px] uppercase tracking-wider font-bold text-obsidian-800 flex items-center gap-1.5">
                                <FileCheck2 className="w-3.5 h-3.5 text-gilt-600" />
                                Hồ sơ căn cứ pháp luật trích dẫn ({msg.citations.length}):
                              </span>
                              <span className="text-[10px] text-obsidian-500 font-sans">
                                (Nhấp vào thẻ để mở trích lục nguyên bản)
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center pt-1">
                              {msg.citations.map((c, cIdx) => (
                                <CitationBadge
                                  key={cIdx}
                                  index={cIdx + 1}
                                  citation={c}
                                  onClick={handleOpenCitation}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Verification Footnote */}
                        <div className="pt-2 text-[11px] font-serif text-obsidian-500 italic border-t border-hairline/60 flex items-center justify-between">
                          <span>
                            * Ý kiến trích xuất tự động qua đối soát quy phạm pháp luật. Vui lòng kiểm tra nguyên văn điều khoản viện dẫn.
                          </span>
                          <span className="font-mono text-[10px] text-obsidian-400 uppercase">
                            Audited by PostgreSQL & pgvector
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Inquest Loading State */}
            {isLoading && (
              <div className="rounded-lg border border-hairline bg-white p-4.5 shadow-subtle flex items-center gap-3">
                <div className="w-7 h-7 rounded bg-obsidian-900 text-parchment-100 flex items-center justify-center shrink-0 animate-pulse">
                  <Scale className="w-4 h-4 text-gilt-300" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-serif text-sm font-semibold text-obsidian-900">
                    Đang tra cứu cơ sở dữ liệu pháp điển...
                  </p>
                  <p className="text-xs font-mono text-obsidian-500">
                    Thực hiện vector search (HNSW cosine) kết hợp tsvector toàn văn để định vị điều khoản nguyên bản.
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Inquiry Drafting Tray (Input Bar) */}
          <div className="p-4 border-t border-hairline bg-parchment-100/70">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-3"
            >
              <div className="flex-1">
                <Input
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Nhập yêu cầu tra cứu pháp lý... (Ví dụ: Thời hạn thông báo sự cố dữ liệu cá nhân là bao lâu?)"
                  disabled={isLoading}
                  className="bg-white border-hairline text-xs md:text-sm h-11 focus:border-obsidian-400 shadow-sm"
                />
              </div>

              <Button
                type="submit"
                variant="gilt"
                size="md"
                disabled={!inputQuery.trim() || isLoading}
                isLoading={isLoading}
                className="h-11 px-6 text-xs font-medium tracking-wide shrink-0"
                icon={<Send className="w-3.5 h-3.5" />}
              >
                Trưng cầu Căn cứ
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Source Verification Drawer */}
      <SourceVerificationDrawer
        citation={selectedCitation}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}

export default function AssistantPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-obsidian-400 font-mono text-xs">
          Đang chuẩn bị Bàn Nghiên cứu Pháp lý...
        </div>
      }
    >
      <AssistantContent />
    </Suspense>
  );
}
