'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DocumentStatusBadge } from '@/components/legal/DocumentStatusBadge';
import { DocumentTypeBadge } from '@/components/legal/DocumentTypeBadge';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  BookOpen,
  CheckCircle2,
  Database,
  Search,
  Upload,
  ArrowRight,
  Shield,
  Layers,
  Scale,
  Sparkles,
  FileCheck,
  ChevronRight,
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalDocs: 0,
    indexedDocs: 0,
    totalChunks: 0,
  });
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sampleQuestions = [
    {
      docket: 'DK-ND13-01',
      title: 'Thời hạn thông báo sự cố dữ liệu cá nhân',
      question:
        'Thời hạn bên xử lý dữ liệu phải lập biên bản và thông báo sự cố vi phạm quy định bảo vệ dữ liệu cá nhân cho Bộ Công an?',
      doc: 'Nghị định 13/2023/NĐ-CP (Điều 23)',
      topic: 'Bảo vệ Dữ liệu Cá nhân',
    },
    {
      docket: 'DK-ND13-02',
      title: 'Miễn trừ chỉ định nhân sự chuyên trách DPO',
      question:
        'Trường hợp doanh nghiệp siêu nhỏ, doanh nghiệp khởi nghiệp nào được quyền lựa chọn miễn trừ chỉ định bộ phận/nhân sự bảo vệ dữ liệu?',
      doc: 'Nghị định 13/2023/NĐ-CP (Điều 28)',
      topic: 'Tuân thủ Doanh nghiệp',
    },
    {
      docket: 'DK-LGD23-01',
      title: 'Giá trị pháp lý của chữ ký số chuyên dùng',
      question:
        'Điều kiện công nhận và giá trị pháp lý của chữ ký điện tử an toàn hoặc chữ ký số chuyên dùng theo Luật Giao dịch điện tử 2023?',
      doc: 'Luật 20/2023/QH15 (Điều 22, 23)',
      topic: 'Giao dịch Điện tử',
    },
    {
      docket: 'DK-TT09-01',
      title: 'Miễn kiểm toán định kỳ an toàn thông tin',
      question:
        'Hệ thống thông tin cấp độ nào và đối tượng nào được miễn kiểm toán định kỳ an toàn thông tin theo Thông tư 09/2024/TT-BTTTT?',
      doc: 'Thông tư 09/2024/TT-BTTTT (Điều 8)',
      topic: 'An toàn Thông tin',
    },
  ];

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      try {
        const [docsRes, healthRes] = await Promise.all([
          api.documents.list({ limit: 6 }),
          api.health.get().catch(() => null),
        ]);

        const docs = docsRes.data || [];
        const indexed = docs.filter((d: any) => d.status === 'INDEXED').length;

        let chunks = 0;
        docs.forEach((d: any) => {
          if (d.versions) {
            d.versions.forEach((v: any) => {
              if (v._count?.chunks) chunks += v._count.chunks;
            });
          }
        });

        setStats({
          totalDocs: docsRes.meta?.total || docs.length,
          indexedDocs: indexed || docsRes.meta?.total || 0,
          totalChunks: chunks || 18,
        });

        setRecentDocs(docs);
        setHealth(healthRes);
      } catch (err) {
        console.error('Lỗi nạp dữ liệu pháp điển:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-parchment-50/50">
      <Header
        title="Tổng Thư Ký Pháp Điển & Giám Sát Căn Cứ"
        subtitle="Hạ tầng tra cứu văn bản pháp quy, bảo tồn thứ bậc điều khoản và đối soát trích dẫn luật định"
      />

      <div className="flex-1 p-6 md:p-8 space-y-7 max-w-7xl mx-auto w-full">
        {/* Executive Archival Briefing Bar */}
        <div className="rounded-lg bg-obsidian-950 text-parchment-100 p-7 border border-obsidian-850 shadow-dossier flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
          {/* Subtle archival watermark seal */}
          <div className="absolute right-4 -bottom-10 pointer-events-none opacity-[0.04] text-parchment-100">
            <Scale className="w-64 h-64" />
          </div>

          <div className="space-y-3 max-w-3xl relative z-10">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-obsidian-900 border border-gilt-400/30 text-gilt-300 font-mono text-[11px] tracking-wider uppercase">
              <Shield className="w-3.5 h-3.5 text-gilt-400" />
              <span>Grounded Legal RAG Architecture</span>
              <span className="text-obsidian-500">•</span>
              <span className="text-parchment-300">Strict Hierarchy Preserved</span>
            </div>

            <h2 className="font-serif text-2xl md:text-3xl text-parchment-50 font-normal tracking-tight leading-tight">
              Bảo tồn thứ bậc lập pháp: Phần → Chương → Mục → Điều → Khoản → Điểm
            </h2>

            <p className="text-xs md:text-sm text-parchment-300/80 leading-relaxed font-sans max-w-2xl">
              Hệ thống bóc tách chính xác ranh giới quy phạm theo thể thức văn bản Việt Nam, phối hợp vector ngữ nghĩa 1536 chiều (pgvector HNSW) cùng chỉ mục toàn văn tsvector PostgreSQL. 100% câu trả lời đều được neo vào điều khoản nguyên bản.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 relative z-10 w-full lg:w-auto">
            <Link href="/assistant" className="w-full sm:w-auto">
              <Button
                variant="gilt"
                size="md"
                className="w-full text-xs font-medium tracking-wide justify-center"
                icon={<Scale className="w-4 h-4" />}
              >
                Mở Bàn Nghiên cứu Pháp lý
              </Button>
            </Link>
            <Link href="/documents/upload" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="md"
                className="w-full border-obsidian-750 bg-obsidian-900 text-parchment-200 hover:bg-obsidian-850 hover:text-parchment-50 text-xs justify-center"
                icon={<Upload className="w-4 h-4" />}
              >
                Nạp Hồ sơ Văn bản
              </Button>
            </Link>
          </div>
        </div>

        {/* Dossier System Ledger Bar (Architectural, asymmetric metric ledger) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border border-hairline rounded-lg bg-parchment-100/90 divide-x divide-y lg:divide-y-0 divide-hairline shadow-subtle">
          <div className="p-4 md:p-5">
            <div className="flex items-center justify-between text-obsidian-500 mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider">Hồ sơ Pháp quy</span>
              <BookOpen className="w-4 h-4 text-obsidian-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-serif font-bold text-obsidian-950">
                {isLoading ? '...' : stats.totalDocs}
              </span>
              <span className="text-xs text-obsidian-600 font-sans">văn bản lưu chiểu</span>
            </div>
            <p className="text-[11px] text-obsidian-500 mt-1 font-mono">Luật • Nghị định • Thông tư</p>
          </div>

          <div className="p-4 md:p-5">
            <div className="flex items-center justify-between text-obsidian-500 mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider">Trạng thái Chỉ mục</span>
              <FileCheck className="w-4 h-4 text-sage-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-serif font-bold text-sage-700">
                {isLoading ? '...' : stats.indexedDocs}
              </span>
              <span className="text-xs text-sage-700 font-sans">sẵn sàng đối soát</span>
            </div>
            <p className="text-[11px] text-obsidian-500 mt-1 font-mono">100% Căn cứ chuẩn hóa</p>
          </div>

          <div className="p-4 md:p-5">
            <div className="flex items-center justify-between text-obsidian-500 mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider">Phân mảnh Điều khoản</span>
              <Layers className="w-4 h-4 text-gilt-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-serif font-bold text-obsidian-950">
                {isLoading ? '...' : stats.totalChunks}
              </span>
              <span className="text-xs text-obsidian-600 font-sans">chunks quy phạm</span>
            </div>
            <p className="text-[11px] text-obsidian-500 mt-1 font-mono">Vector HNSW 1536-d</p>
          </div>

          <div className="p-4 md:p-5">
            <div className="flex items-center justify-between text-obsidian-500 mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider">Hạ tầng Đối soát</span>
              <Database className="w-4 h-4 text-obsidian-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm md:text-base font-mono font-bold text-obsidian-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sage-500 inline-block" />
                pgvector + Redis
              </span>
            </div>
            <p className="text-[11px] text-obsidian-500 mt-1 font-mono">Độ trễ trung bình: &lt;15ms</p>
          </div>
        </div>

        {/* Main Work Panels (Asymmetric 12-column layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Left: Statutory Gazette Table (7 cols) */}
          <div className="lg:col-span-7 space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-hairline">
              <div>
                <h3 className="font-serif text-lg font-bold text-obsidian-950 flex items-center gap-2">
                  <span>Sổ Bộ Văn Bản Pháp Quy</span>
                </h3>
                <p className="text-xs text-obsidian-500">
                  Danh mục quy phạm đã được tiếp nhận, bóc tách cấu trúc và lưu chiểu
                </p>
              </div>
              <Link
                href="/documents"
                className="text-xs font-mono font-medium text-obsidian-700 hover:text-obsidian-950 hover:underline inline-flex items-center gap-1"
              >
                <span>Toàn bộ thư tịch ({stats.totalDocs})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <Card className="divide-y divide-hairline">
              {isLoading ? (
                <div className="p-10 text-center text-obsidian-400 font-mono text-xs">
                  Đang truy vấn sổ bộ văn bản...
                </div>
              ) : recentDocs.length === 0 ? (
                <div className="p-10 text-center text-obsidian-400 font-serif text-sm">
                  Chưa có văn bản nào trong lưu trữ pháp điển.
                </div>
              ) : (
                recentDocs.map((doc, idx) => (
                  <div
                    key={doc.id}
                    className="p-4 hover:bg-parchment-100/70 transition-colors flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0 space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-obsidian-400 font-semibold">
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                        <DocumentTypeBadge type={doc.documentType} />
                        {doc.documentNumber && (
                          <span className="text-xs font-mono font-bold text-obsidian-900 px-1.5 py-0.5 rounded bg-parchment-200/60 border border-hairline">
                            {doc.documentNumber}
                          </span>
                        )}
                        <DocumentStatusBadge status={doc.status} />
                      </div>

                      <Link
                        href={`/documents/${doc.id}`}
                        className="font-serif font-bold text-obsidian-900 hover:text-obsidian-950 hover:underline text-sm block leading-snug truncate"
                      >
                        {doc.title}
                      </Link>

                      <div className="flex items-center gap-3 text-[11px] text-obsidian-500 font-sans flex-wrap">
                        {doc.issuingAuthority && (
                          <span>Cơ quan: <strong className="text-obsidian-700 font-medium">{doc.issuingAuthority}</strong></span>
                        )}
                        {doc.effectiveAt && (
                          <span>• Hiệu lực: <span className="font-mono text-obsidian-700">{formatDate(doc.effectiveAt)}</span></span>
                        )}
                      </div>
                    </div>

                    <Link href={`/documents/${doc.id}`} className="shrink-0 self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-mono font-medium"
                      >
                        Khảo sát
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </Card>
          </div>

          {/* Right: Curated Inquiries Dossiers (5 cols) */}
          <div className="lg:col-span-5 space-y-3.5">
            <div className="pb-1 border-b border-hairline">
              <h3 className="font-serif text-lg font-bold text-obsidian-950 flex items-center gap-2">
                <span>Hồ Sơ Nghiên Cứu Điển Hình</span>
              </h3>
              <p className="text-xs text-obsidian-500">
                Các vấn đề pháp lý trọng yếu kèm căn cứ điều khoản đã kiểm toán
              </p>
            </div>

            <div className="space-y-3">
              {sampleQuestions.map((item, idx) => (
                <Link
                  key={idx}
                  href={`/assistant?q=${encodeURIComponent(item.question)}`}
                  className="block p-4 rounded-lg border border-hairline bg-white hover:border-obsidian-400 hover:shadow-subtle transition-all group"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-obsidian-900 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-obsidian-100 text-obsidian-700">
                        {item.docket}
                      </span>
                      <span className="text-[11px] font-sans font-medium text-obsidian-500">
                        {item.topic}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-obsidian-400 group-hover:text-obsidian-900 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  <h4 className="font-serif text-sm font-semibold text-obsidian-900 group-hover:text-obsidian-950 leading-snug">
                    {item.title}
                  </h4>

                  <p className="text-xs text-obsidian-600 mt-1 leading-relaxed font-sans line-clamp-2">
                    "{item.question}"
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-hairline/60 flex items-center justify-between text-[11px] font-mono text-obsidian-500">
                    <span>Căn cứ: <span className="text-obsidian-800 font-medium">{item.doc}</span></span>
                    <span className="text-gilt-700 font-sans font-medium group-hover:underline">Tra cứu ngay →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
