'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DocumentTypeBadge } from '@/components/legal/DocumentTypeBadge';
import { DocumentStatusBadge } from '@/components/legal/DocumentStatusBadge';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  Search,
  Filter,
  Upload,
  BookOpen,
  RotateCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Scale,
} from 'lucide-react';
import { LegalDocumentType, LEGAL_DOCUMENT_TYPE_LABELS } from '@legal-rag/shared';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await api.documents.list({
        search: search || undefined,
        documentType: selectedType || undefined,
        status: selectedStatus || undefined,
        page,
        limit: 10,
      });

      setDocuments(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
      setTotalCount(res.meta?.total || 0);
    } catch (err) {
      console.error('Lỗi nạp danh sách văn bản:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [page, selectedType, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDocuments();
  };

  const handleReindex = async (id: string) => {
    setActionLoading(id);
    try {
      await api.documents.reindex(id);
      await fetchDocuments();
    } catch (err: any) {
      alert(err.message || 'Lỗi đánh chỉ mục lại');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Xác nhận xóa văn bản "${title}" khỏi hệ thống lưu chiểu?`)) {
      return;
    }

    setActionLoading(id);
    try {
      await api.documents.delete(id);
      await fetchDocuments();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa văn bản');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-parchment-50/50">
      <Header
        title="Kho Thư Tịch & Sổ Bộ Văn Bản Quy Phạm"
        subtitle="Quản lý toàn văn, bóc tách cấu trúc thứ bậc điều khoản và lưu chiểu vector quy phạm"
        action={
          <Link href="/documents/upload">
            <Button
              size="sm"
              variant="gilt"
              className="text-xs font-medium"
              icon={<Upload className="w-3.5 h-3.5" />}
            >
              Nạp Hồ sơ Văn bản
            </Button>
          </Link>
        }
      />

      <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Search & Filter Codex Bar */}
        <Card className="bg-white">
          <CardContent className="p-4">
            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-col md:flex-row items-center gap-3"
            >
              <div className="flex-1 w-full">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tra cứu theo tên văn bản, số hiệu, cơ quan ban hành hoặc nội dung..."
                  icon={<Search className="w-4 h-4 text-obsidian-400" />}
                  className="bg-white border-hairline text-xs md:text-sm h-10"
                />
              </div>

              {/* Type Select */}
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setPage(1);
                }}
                className="h-10 px-3 py-1.5 rounded border border-hairline bg-parchment-50 text-xs font-mono text-obsidian-800 focus:outline-none focus:ring-1 focus:ring-obsidian-500 w-full md:w-52"
              >
                <option value="">Tất cả thể loại văn bản</option>
                {Object.entries(LEGAL_DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>

              {/* Status Select */}
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="h-10 px-3 py-1.5 rounded border border-hairline bg-parchment-50 text-xs font-mono text-obsidian-800 focus:outline-none focus:ring-1 focus:ring-obsidian-500 w-full md:w-44"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="INDEXED">Đã đánh chỉ mục</option>
                <option value="PROCESSING">Đang xử lý</option>
                <option value="PENDING">Chờ nạp</option>
                <option value="FAILED">Thất bại</option>
              </select>

              <Button
                type="submit"
                size="sm"
                variant="obsidian"
                className="w-full md:w-auto h-10 text-xs font-mono px-4"
              >
                Lọc kết quả
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Gazette Ledger Table */}
        <Card className="overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hairline bg-parchment-150/80 text-[11px] font-mono uppercase tracking-wider text-obsidian-700">
                  <th className="py-3 px-4 font-semibold">Tên Văn bản / Số hiệu</th>
                  <th className="py-3 px-4 font-semibold">Phân loại</th>
                  <th className="py-3 px-4 font-semibold">Cơ quan ban hành</th>
                  <th className="py-3 px-4 font-semibold">Ngày hiệu lực</th>
                  <th className="py-3 px-4 font-semibold">Trạng thái</th>
                  <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-obsidian-400 font-mono">
                      Đang tra cứu danh mục quy phạm...
                    </td>
                  </tr>
                ) : documents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-obsidian-500 font-serif">
                      Không tìm thấy văn bản phù hợp với tiêu chí tra cứu.
                    </td>
                  </tr>
                ) : (
                  documents.map((doc, idx) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-parchment-100/60 transition-colors group"
                    >
                      <td className="py-3.5 px-4 max-w-md">
                        <Link
                          href={`/documents/${doc.id}`}
                          className="font-serif font-bold text-obsidian-950 hover:underline block line-clamp-2 leading-snug"
                        >
                          {doc.title}
                        </Link>
                        {doc.documentNumber && (
                          <span className="text-[11px] font-mono text-obsidian-600 mt-0.5 inline-block font-medium">
                            Số hiệu: {doc.documentNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <DocumentTypeBadge type={doc.documentType} />
                      </td>
                      <td className="py-3.5 px-4 text-obsidian-700 whitespace-nowrap font-sans font-medium">
                        {doc.issuingAuthority || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-obsidian-700 whitespace-nowrap font-mono text-[11px]">
                        {formatDate(doc.effectiveAt)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <DocumentStatusBadge status={doc.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/documents/${doc.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              title="Xem cấu trúc và chi tiết điều khoản"
                              icon={<Layers className="w-3.5 h-3.5" />}
                              className="h-8 text-xs font-mono"
                            >
                              Khảo sát
                            </Button>
                          </Link>

                          <Button
                            variant="ghost"
                            size="sm"
                            title="Đánh chỉ mục lại văn bản này"
                            onClick={() => handleReindex(doc.id)}
                            isLoading={actionLoading === doc.id}
                            className="h-8 w-8 p-0 text-obsidian-400 hover:text-obsidian-900"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            title="Xóa văn bản"
                            onClick={() => handleDelete(doc.id, doc.title)}
                            isLoading={actionLoading === doc.id}
                            className="h-8 w-8 p-0 text-obsidian-300 hover:text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-3.5 border-t border-hairline bg-parchment-50 flex items-center justify-between text-xs text-obsidian-600 font-mono">
            <span>
              Lưu chiểu {documents.length} / tổng số {totalCount} văn bản
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 px-2.5"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-mono text-obsidian-800 font-medium">
                Tập {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 px-2.5"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
