'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DocumentTypeBadge } from '@/components/legal/DocumentTypeBadge';
import { DocumentStatusBadge } from '@/components/legal/DocumentStatusBadge';
import { HierarchyTree } from '@/components/legal/HierarchyTree';
import { api } from '@/lib/api';
import { formatDate, formatDateTime } from '@/lib/utils';
import {
  ArrowLeft,
  Scale,
  RotateCw,
  Layers,
  FileText,
  History,
  CheckCircle2,
  Calendar,
  Building,
  Hash,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [document, setDocument] = useState<any>(null);
  const [structure, setStructure] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'raw' | 'versions'>('hierarchy');
  const [isLoading, setIsLoading] = useState(true);
  const [isReindexing, setIsReindexing] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [docData, structData, verData] = await Promise.all([
        api.documents.getById(id),
        api.documents.getStructure(id).catch(() => ({ rootNodes: [] })),
        api.documents.getVersions(id).catch(() => []),
      ]);

      setDocument(docData);
      setStructure(structData);
      setVersions(verData);
    } catch (err) {
      console.error('Lỗi nạp chi tiết văn bản:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const handleReindex = async () => {
    setIsReindexing(true);
    try {
      await api.documents.reindex(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi đánh chỉ mục lại');
    } finally {
      setIsReindexing(false);
    }
  };

  const handleCopyRaw = () => {
    if (document?.versions?.[0]?.rawText) {
      navigator.clipboard.writeText(document.versions[0].rawText);
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-parchment-50">
        <Header title="Đang tra cứu thư tịch..." />
        <div className="flex-1 flex items-center justify-center p-12 text-obsidian-400 font-mono text-xs">
          Đang truy xuất cấu trúc cây điều khoản và vector chỉ mục...
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex-1 flex flex-col bg-parchment-50">
        <Header title="Không tìm thấy văn bản" />
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-obsidian-600 gap-4">
          <p className="font-serif">Văn bản không tồn tại hoặc đã bị rút khỏi sổ lưu chiểu.</p>
          <Link href="/documents">
            <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />}>
              Quay lại Sổ bộ Thư tịch
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const latestVersion = document.versions?.[0];
  const chunkCount = latestVersion?._count?.chunks || latestVersion?.chunks?.length || 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-parchment-50/50">
      <Header
        title={document.title}
        subtitle={`Số hiệu: ${document.documentNumber || '—'} | Cơ quan: ${document.issuingAuthority || '—'}`}
        action={
          <div className="flex items-center gap-2.5">
            <Link href={`/assistant?docId=${document.id}`}>
              <Button
                size="sm"
                variant="gilt"
                className="text-xs font-medium"
                icon={<Scale className="w-3.5 h-3.5" />}
              >
                Trưng cầu ý kiến văn bản này
              </Button>
            </Link>

            <Button
              size="sm"
              variant="outline"
              onClick={handleReindex}
              isLoading={isReindexing}
              icon={<RotateCw className="w-3.5 h-3.5" />}
              className="text-xs font-mono"
            >
              Chỉ mục lại
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/documents"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-obsidian-600 hover:text-obsidian-950 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Quay lại Kho Thư tịch & Sổ bộ</span>
          </Link>
        </div>

        {/* Metadata Archival Dossier Card */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="space-y-3.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <DocumentTypeBadge type={document.documentType} />
                  <DocumentStatusBadge status={document.status} />
                  {document.sourceUrl && (
                    <a
                      href={document.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono bg-parchment-100 text-obsidian-700 border border-hairline hover:underline"
                    >
                      <span>Nguồn công báo trực tuyến</span>
                      <ExternalLink className="w-3 h-3 text-obsidian-400" />
                    </a>
                  )}
                </div>

                <h1 className="font-serif text-2xl md:text-3xl font-bold text-obsidian-950 leading-tight">
                  {document.title}
                </h1>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-hairline text-xs font-sans">
                  <div>
                    <span className="text-obsidian-400 font-mono text-[10px] uppercase block mb-1">
                      Số hiệu văn bản
                    </span>
                    <span className="font-mono font-bold text-obsidian-900 text-sm">
                      {document.documentNumber || '—'}
                    </span>
                  </div>

                  <div>
                    <span className="text-obsidian-400 font-mono text-[10px] uppercase block mb-1">
                      Cơ quan ban hành
                    </span>
                    <span className="font-medium text-obsidian-900">
                      {document.issuingAuthority || '—'}
                    </span>
                  </div>

                  <div>
                    <span className="text-obsidian-400 font-mono text-[10px] uppercase block mb-1">
                      Ngày ban hành
                    </span>
                    <span className="font-mono text-obsidian-800">
                      {formatDate(document.publishedAt)}
                    </span>
                  </div>

                  <div>
                    <span className="text-obsidian-400 font-mono text-[10px] uppercase block mb-1">
                      Ngày có hiệu lực
                    </span>
                    <span className="font-mono font-bold text-sage-700">
                      {formatDate(document.effectiveAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vector & Audit Ledger Summary */}
              <div className="p-4 rounded border border-hairline bg-parchment-100/70 shrink-0 w-full lg:w-72 space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between pb-1.5 border-b border-hairline">
                  <span className="text-obsidian-500 uppercase text-[10px] tracking-wider">Hạ tầng pgvector:</span>
                  <span className="font-bold text-sage-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Hoạt động
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-obsidian-500">Mảnh điều khoản:</span>
                  <span className="font-bold text-obsidian-950">{chunkCount} chunks</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-obsidian-500">Bản lưu chiểu:</span>
                  <span className="font-semibold text-obsidian-800">
                    v{latestVersion?.version || 1}
                  </span>
                </div>
                {latestVersion?.checksum && (
                  <div className="pt-2 border-t border-hairline">
                    <span className="text-obsidian-400 block text-[10px]">SHA-256 Checksum:</span>
                    <span
                      className="font-mono text-[10px] text-obsidian-600 truncate block mt-0.5"
                      title={latestVersion.checksum}
                    >
                      {latestVersion.checksum}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs (Archival Ledger style) */}
        <div className="flex items-center gap-1 border-b border-hairline pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('hierarchy')}
            className={`py-2 px-4 rounded text-xs font-mono font-medium flex items-center gap-2 transition-all ${
              activeTab === 'hierarchy'
                ? 'bg-obsidian-900 text-parchment-100 shadow-subtle'
                : 'text-obsidian-600 hover:text-obsidian-950 hover:bg-parchment-150'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Cây Phân Cấp Quy Phạm ({structure?.rootNodes?.length || 0} mục chính)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('raw')}
            className={`py-2 px-4 rounded text-xs font-mono font-medium flex items-center gap-2 transition-all ${
              activeTab === 'raw'
                ? 'bg-obsidian-900 text-parchment-100 shadow-subtle'
                : 'text-obsidian-600 hover:text-obsidian-950 hover:bg-parchment-150'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Toàn Văn Nguyên Bản
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('versions')}
            className={`py-2 px-4 rounded text-xs font-mono font-medium flex items-center gap-2 transition-all ${
              activeTab === 'versions'
                ? 'bg-obsidian-900 text-parchment-100 shadow-subtle'
                : 'text-obsidian-600 hover:text-obsidian-950 hover:bg-parchment-150'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Lịch Sử Lưu Chiểu ({versions.length})
          </button>
        </div>

        {/* TAB 1: CÂY CẤU TRÚC PHÁP LUẬT */}
        {activeTab === 'hierarchy' && (
          <Card className="bg-white">
            <CardHeader className="py-4 border-b border-hairline bg-parchment-100/50">
              <CardTitle className="font-serif text-base text-obsidian-950">
                Thứ Bậc Quy Phạm Pháp Luật Đã Chuẩn Hóa
              </CardTitle>
              <CardDescription className="text-xs text-obsidian-500 font-sans">
                Bảo tồn toàn vẹn quan hệ Chương → Mục → Điều → Khoản → Điểm để truy vấn không thất lạc ngữ cảnh.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 md:p-6">
              <HierarchyTree nodes={structure?.rootNodes || []} />
            </CardContent>
          </Card>
        )}

        {/* TAB 2: TOÀN VĂN NGUYÊN BẢN */}
        {activeTab === 'raw' && (
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-hairline bg-parchment-100/50">
              <div>
                <CardTitle className="font-serif text-base text-obsidian-950">
                  Toàn Văn Bản Gốc Được Lưu Chiểu
                </CardTitle>
                <CardDescription className="text-xs text-obsidian-500 font-sans">
                  Dữ liệu gốc được trích xuất phục vụ kiểm toán đối chiếu trích dẫn nguyên văn.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyRaw}
                icon={copiedRaw ? <Check className="w-3.5 h-3.5 text-sage-600" /> : <Copy className="w-3.5 h-3.5" />}
                className="text-xs font-mono"
              >
                {copiedRaw ? 'Đã trích lục' : 'Sao chép toàn văn'}
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <pre className="p-4 rounded bg-parchment-50 border border-hairline font-serif text-sm leading-relaxed text-obsidian-900 whitespace-pre-wrap overflow-x-auto max-h-[600px] select-text">
                {latestVersion?.rawText || 'Không có dữ liệu toàn văn.'}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* TAB 3: LỊCH SỬ PHIÊN BẢN */}
        {activeTab === 'versions' && (
          <Card className="bg-white">
            <div className="divide-y divide-hairline">
              {versions.map((ver) => (
                <div
                  key={ver.id}
                  className="p-5 flex items-center justify-between hover:bg-parchment-100/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-sm text-obsidian-950">
                        Bản lưu chiểu v{ver.version}
                      </span>
                      {ver.version === latestVersion?.version && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-sage-50 text-sage-800 border border-sage-200">
                          Đang hiệu lực
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-obsidian-500 font-mono">
                      Checksum: {ver.checksum}
                    </p>
                    <p className="text-[11px] text-obsidian-400 font-mono">
                      Lưu chiểu ngày: {formatDateTime(ver.createdAt)}
                    </p>
                  </div>

                  <div className="text-right text-xs font-mono">
                    <span className="text-obsidian-500 block">Số vector chunks:</span>
                    <span className="font-bold text-obsidian-900 text-sm">
                      {ver._count?.chunks || 0} chunks
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
