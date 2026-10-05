import React from 'react';
import { RetrievedCitation } from '@legal-rag/shared';
import {
  X,
  ShieldCheck,
  BookOpen,
  FileText,
  Layers,
  Scale,
  Hash,
} from 'lucide-react';
import Link from 'next/link';

interface SourceVerificationDrawerProps {
  citation: RetrievedCitation | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SourceVerificationDrawer({
  citation,
  isOpen,
  onClose,
}: SourceVerificationDrawerProps) {
  if (!isOpen || !citation) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-obsidian-950/50 backdrop-blur-sm transition-opacity">
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-xl bg-white shadow-drawer flex flex-col h-full border-l border-hairline animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-6 border-b border-hairline flex items-start justify-between bg-parchment-50/80">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase bg-sage-50 text-sage-800 border border-sage-200/90 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-sage-600" />
                  Căn cứ Đã Xác thực Cơ sở Dữ liệu
                </span>
                {citation.page && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-parchment-200 text-slate-700 border border-hairline">
                    Trang {citation.page}
                  </span>
                )}
              </div>
              <h2 className="text-base font-serif font-bold text-slate-900 leading-tight">
                Hồ sơ Căn cứ Luật định (Statutory Evidence Ledger)
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-parchment-200/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FCFBF8]">
            {/* Document Info Card */}
            <div className="p-4 rounded-xl border border-hairline bg-white shadow-subtle space-y-2.5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-parchment-100 border border-hairline flex items-center justify-center shrink-0 text-slate-700 mt-0.5">
                  <Scale className="w-4 h-4 text-gilt-600" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-slate-900 text-sm leading-snug">
                    {citation.documentTitle}
                  </h3>
                  {citation.documentNumber && (
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                      Số hiệu công báo: {citation.documentNumber}
                    </p>
                  )}
                </div>
              </div>

              {citation.hierarchyPath && (
                <div className="pt-2.5 border-t border-hairline flex items-center gap-2 text-xs text-slate-600">
                  <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-900">Vị trí điều khoản:</span>
                  <span className="truncate font-sans">{citation.hierarchyPath}</span>
                </div>
              )}
            </div>

            {/* Verbatim Statutory Quote */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                  Nguyên văn quy phạm trích xuất
                </span>
                <span className="text-[11px] text-slate-400 font-serif italic">
                  Đối chiếu nguyên vẹn từ cơ sở dữ liệu
                </span>
              </div>
              <div className="p-5 rounded-xl border border-hairline bg-parchment-100 font-serif text-[13.5px] leading-relaxed text-[#141A24] shadow-subtle whitespace-pre-wrap selection:bg-gilt-200/50">
                &ldquo;{citation.quote}&rdquo;
              </div>
            </div>

            {/* Traceability Metadata */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                Thông số Kiểm toán & Lưu vết
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-hairline bg-white shadow-subtle">
                  <span className="text-slate-400 font-mono text-[10px] block mb-1">Định danh Chunk</span>
                  <span className="font-mono text-[11px] text-slate-800 truncate block" title={citation.chunkId}>
                    {citation.chunkId ? citation.chunkId.slice(0, 18) + '...' : '—'}
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-hairline bg-white shadow-subtle">
                  <span className="text-slate-400 font-mono text-[10px] block mb-1">Xác thực Máy chủ</span>
                  <span className="font-medium text-sage-700 flex items-center gap-1 font-mono text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5" /> Khớp 100% Corpus
                  </span>
                </div>
              </div>
            </div>

            {/* Grounding RAG Assurance Note */}
            <div className="p-4 rounded-xl bg-parchment-100/90 border border-hairline text-xs text-slate-700 leading-relaxed font-sans">
              <p className="font-serif font-bold text-slate-900 mb-1">
                Nguyên tắc Không Bịa đặt Căn cứ (Zero-Hallucination Protocol):
              </p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Mọi trích dẫn hiển thị đều được máy chủ backend thẩm định chéo với vector chunk thực tế lưu trữ tại PostgreSQL trước khi trả về cho chuyên viên. Các điều khoản không tồn tại trong văn bản pháp luật lưu trữ sẽ bị loại bỏ hoàn toàn.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-hairline bg-parchment-50/80 flex items-center justify-between gap-3">
            <Link
              href={`/documents/${citation.documentId}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline"
            >
              <BookOpen className="w-3.5 h-3.5 text-gilt-600" />
              Xem toàn văn quy định này
            </Link>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-obsidian-900 hover:bg-obsidian-850 text-white text-xs font-medium transition-colors"
            >
              Đóng hồ sơ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
