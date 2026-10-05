'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import {
  Upload,
  Globe,
  FileCode,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  FileText,
  Scale,
} from 'lucide-react';
import { LegalDocumentType, LEGAL_DOCUMENT_TYPE_LABELS } from '@legal-rag/shared';

export default function DocumentUploadPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'file' | 'url' | 'text'>('file');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any>(null);

  // Common metadata
  const [title, setTitle] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentType, setDocumentType] = useState<LegalDocumentType>('DECREE');
  const [issuingAuthority, setIssuingAuthority] = useState('Chính phủ');
  const [publishedAt, setPublishedAt] = useState('');
  const [effectiveAt, setEffectiveAt] = useState('');

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // URL state
  const [url, setUrl] = useState('');

  // Manual text state
  const [manualContent, setManualContent] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Vui lòng chọn tập tin cần lưu chiểu.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (title) formData.append('title', title);
    if (documentNumber) formData.append('documentNumber', documentNumber);
    if (documentType) formData.append('documentType', documentType);
    if (issuingAuthority) formData.append('issuingAuthority', issuingAuthority);
    if (publishedAt) formData.append('publishedAt', publishedAt);
    if (effectiveAt) formData.append('effectiveAt', effectiveAt);

    try {
      const res = await api.documents.uploadFile(formData);
      setSuccess(res);
      setTimeout(() => {
        router.push(`/documents/${res.document.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải tập tin lên');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      setError('Vui lòng nhập đường dẫn URL hợp lệ.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.documents.ingestUrl({
        url,
        title: title || undefined,
        documentNumber: documentNumber || undefined,
        documentType: documentType || undefined,
        issuingAuthority: issuingAuthority || undefined,
      });

      setSuccess(res);
      setTimeout(() => {
        router.push(`/documents/${res.document.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi thu thập URL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !manualContent) {
      setError('Vui lòng nhập đầy đủ tiêu đề và nội dung văn bản.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.documents.createManual({
        title,
        content: manualContent,
        documentNumber: documentNumber || undefined,
        documentType,
        issuingAuthority: issuingAuthority || undefined,
        publishedAt: publishedAt || undefined,
        effectiveAt: effectiveAt || undefined,
      });

      setSuccess(res);
      setTimeout(() => {
        router.push(`/documents/${res.document.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi lưu văn bản');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-parchment-50/50">
      <Header
        title="Tiếp Nhận & Lưu Chiểu Văn Bản Pháp Quy"
        subtitle="Hỗ trợ các kênh nạp: Tải tập tin PDF/TXT/MD, Thu thập Công báo URL (Chống SSRF) hoặc Nhập trực tiếp"
      />

      <div className="flex-1 p-6 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
        {/* Success Alert */}
        {success && (
          <div className="p-4 rounded border border-sage-300 bg-sage-50 text-sage-900 text-xs flex items-center justify-between shadow-subtle animate-in fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-sage-700 shrink-0" />
              <div>
                <p className="font-serif font-bold text-sm">Tiếp nhận & Lưu chiểu thành công!</p>
                <p className="text-sage-800 mt-0.5 font-sans">
                  Văn bản đã được bóc tách cây quy phạm pháp luật và đánh chỉ mục vector. Đang chuyển đến bản ghi...
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-sage-700 animate-pulse" />
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded border border-rose-300 bg-rose-50 text-rose-900 text-xs flex items-center gap-3 shadow-subtle">
            <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />
            <div>
              <p className="font-serif font-bold">Không thể tiếp nhận văn bản:</p>
              <p className="text-rose-800 mt-0.5 font-sans">{error}</p>
            </div>
          </div>
        )}

        {/* Tabs Selection (Archival Ledger Tab Strip) */}
        <div className="flex items-center gap-1.5 p-1 rounded border border-hairline bg-parchment-150">
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-2 px-3 rounded text-xs font-mono font-medium flex items-center justify-center gap-2 transition-all ${
              activeTab === 'file'
                ? 'bg-obsidian-900 text-parchment-100 shadow-subtle font-semibold'
                : 'text-obsidian-600 hover:text-obsidian-950 hover:bg-parchment-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Tập Tin Văn Bản (PDF, TXT, MD)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-2 px-3 rounded text-xs font-mono font-medium flex items-center justify-center gap-2 transition-all ${
              activeTab === 'url'
                ? 'bg-obsidian-900 text-parchment-100 shadow-subtle font-semibold'
                : 'text-obsidian-600 hover:text-obsidian-950 hover:bg-parchment-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Thu Thập URL (Bảo Vệ SSRF)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-2 px-3 rounded text-xs font-mono font-medium flex items-center justify-center gap-2 transition-all ${
              activeTab === 'text'
                ? 'bg-obsidian-900 text-parchment-100 shadow-subtle font-semibold'
                : 'text-obsidian-600 hover:text-obsidian-950 hover:bg-parchment-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Nhập Trực Tiếp Bản Gốc
          </button>
        </div>

        {/* Form Container */}
        <Card className="bg-white">
          {/* TAB 1: FILE UPLOAD */}
          {activeTab === 'file' && (
            <form onSubmit={handleFileUpload}>
              <CardHeader className="border-b border-hairline bg-parchment-100/50">
                <CardTitle className="font-serif text-base text-obsidian-950">
                  Nạp Hồ Sơ Tập Tin Văn Bản Quy Phạm
                </CardTitle>
                <CardDescription className="text-xs text-obsidian-500 font-sans">
                  Hỗ trợ định dạng PDF thể thức văn bản, TXT, Markdown (Tối đa 20MB). Tự động phân tách Phần, Chương, Mục, Điều, Khoản, Điểm.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 p-6">
                {/* File Drop Area */}
                <div className="border-2 border-dashed border-hairline hover:border-obsidian-400 rounded-lg p-6 text-center transition-colors bg-parchment-50/70">
                  <Upload className="w-9 h-9 text-obsidian-400 mx-auto mb-2" />
                  <p className="text-xs font-serif font-bold text-obsidian-900">
                    {selectedFile ? selectedFile.name : 'Chọn hoặc kéo thả tập tin văn bản vào đây'}
                  </p>
                  <p className="text-[11px] font-mono text-obsidian-500 mt-1">
                    {selectedFile
                      ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                      : 'Định dạng được chấp thuận: .pdf, .txt, .md'}
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.txt,.md"
                    onChange={handleFileChange}
                    className="mt-3 text-xs text-obsidian-700 font-mono file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-mono file:bg-obsidian-900 file:text-parchment-100 hover:file:bg-obsidian-850 cursor-pointer"
                  />
                </div>

                {/* Common Metadata Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-mono font-semibold text-obsidian-800 block">
                      Tiêu đề Văn bản
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ví dụ: Nghị định số 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân"
                      className="bg-white border-hairline text-xs md:text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-obsidian-800 block">
                      Số hiệu Văn bản
                    </label>
                    <Input
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      placeholder="Ví dụ: 13/2023/NĐ-CP"
                      className="bg-white border-hairline text-xs md:text-sm font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-obsidian-800 block">
                      Loại Văn bản
                    </label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value as LegalDocumentType)}
                      className="h-10 px-3 py-1.5 rounded border border-hairline bg-parchment-50 text-xs font-mono text-obsidian-800 focus:outline-none focus:ring-1 focus:ring-obsidian-500 w-full"
                    >
                      {Object.entries(LEGAL_DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-obsidian-800 block">
                      Cơ quan ban hành
                    </label>
                    <Input
                      value={issuingAuthority}
                      onChange={(e) => setIssuingAuthority(e.target.value)}
                      placeholder="Ví dụ: Chính phủ, Quốc hội, Bộ Thông tin và Truyền thông"
                      className="bg-white border-hairline text-xs md:text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-obsidian-800 block">
                      Ngày có hiệu lực
                    </label>
                    <Input
                      type="date"
                      value={effectiveAt}
                      onChange={(e) => setEffectiveAt(e.target.value)}
                      className="bg-white border-hairline text-xs md:text-sm font-mono"
                    />
                  </div>
                </div>

                {/* PDF Ingestion Rule Note */}
                <div className="p-3.5 rounded border border-gilt-300 bg-gilt-50 text-xs text-gilt-900 flex items-start gap-2.5 font-sans">
                  <ShieldAlert className="w-4 h-4 text-gilt-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Quy chuẩn bóc tách PDF:</span> Trích xuất văn bản số trực tiếp theo lớp text chuẩn. Trường hợp scan hình ảnh không có OCR, hệ thống sẽ phát hiện để bảo toàn tính trung thực của căn cứ pháp lý.
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end gap-3 border-t border-hairline p-4 bg-parchment-50">
                <Button
                  type="submit"
                  variant="gilt"
                  isLoading={isLoading}
                  disabled={!selectedFile}
                  icon={<Upload className="w-3.5 h-3.5" />}
                  className="text-xs font-medium tracking-wide h-10 px-6"
                >
                  Tiếp Nhận & Đánh Chỉ Mục
                </Button>
              </CardFooter>
            </form>
          )}

          {/* TAB 2: URL INGESTION */}
          {activeTab === 'url' && (
            <form onSubmit={handleUrlSubmit}>
              <CardHeader className="border-b border-hairline bg-parchment-100/50">
                <CardTitle className="font-serif text-base text-obsidian-950">
                  Thu Thập Văn Bản Từ Cổng Thông Tin Công Báo
                </CardTitle>
                <CardDescription className="text-xs text-obsidian-500 font-sans">
                  Nhập địa chỉ URL công khai chứa toàn văn quy phạm để cào và chuẩn hóa.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 p-6">
                {/* SSRF Security Guarantee Banner */}
                <div className="p-4 rounded border border-obsidian-850 bg-obsidian-950 text-parchment-100 text-xs space-y-1.5 shadow-subtle">
                  <div className="flex items-center gap-2 text-gilt-300 font-mono font-semibold">
                    <ShieldCheck className="w-4 h-4 text-gilt-400" />
                    Cơ chế Bảo vệ Chống SSRF (Server-Side Request Forgery) Hoạt động:
                  </div>
                  <p className="text-parchment-300/80 leading-relaxed text-[11px] font-sans">
                    Hệ thống thực hiện phân giải DNS độc lập và kiểm tra dải IP đích trước khi gửi request. Mọi địa chỉ loopback (127.0.0.0/8, ::1), mạng nội bộ (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16) và Cloud Metadata (169.254.169.254) đều bị từ chối truy cập.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-obsidian-800 block">
                    Đường dẫn URL công khai (HTTP / HTTPS)
                  </label>
                  <Input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://chinhphu.vn/van-ban-quy-pham-phap-luat..."
                    icon={<Globe className="w-4 h-4 text-obsidian-400" />}
                    required
                    className="bg-white border-hairline text-xs md:text-sm font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-mono font-semibold text-obsidian-800 block">
                      Tiêu đề Văn bản (tự động phân giải nếu để trống)
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Tiêu đề quy định hoặc tên nghị định"
                      className="bg-white border-hairline text-xs md:text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-obsidian-800 block">
                      Số hiệu Văn bản
                    </label>
                    <Input
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      placeholder="Ví dụ: 20/2023/QH15"
                      className="bg-white border-hairline text-xs md:text-sm font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-obsidian-800 block">
                      Loại Văn bản
                    </label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value as LegalDocumentType)}
                      className="h-10 px-3 py-1.5 rounded border border-hairline bg-parchment-50 text-xs font-mono text-obsidian-800 focus:outline-none focus:ring-1 focus:ring-obsidian-500 w-full"
                    >
                      {Object.entries(LEGAL_DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end gap-3 border-t border-hairline p-4 bg-parchment-50">
                <Button
                  type="submit"
                  variant="gilt"
                  isLoading={isLoading}
                  disabled={!url}
                  icon={<Globe className="w-3.5 h-3.5" />}
                  className="text-xs font-medium tracking-wide h-10 px-6"
                >
                  Thu Thập & Đánh Chỉ Mục URL
                </Button>
              </CardFooter>
            </form>
          )}

          {/* TAB 3: MANUAL TEXT */}
          {activeTab === 'text' && (
            <form onSubmit={handleManualSubmit}>
              <CardHeader className="border-b border-hairline bg-parchment-100/50">
                <CardTitle className="font-serif text-base text-obsidian-950">
                  Nhập Toàn Văn Văn Bản Quy Phạm Trực Tiếp
                </CardTitle>
                <CardDescription className="text-xs text-obsidian-500 font-sans">
                  Dán nội dung dự thảo hoặc thông tư để bộ phân giải bóc tách cây cấu trúc tự động.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-mono font-semibold text-obsidian-800 block">
                      Tiêu đề Văn bản *
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ví dụ: Quy chế Bảo đảm An toàn thông tin nội bộ Doanh nghiệp"
                      required
                      className="bg-white border-hairline text-xs md:text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-obsidian-800 block">
                      Số hiệu Văn bản
                    </label>
                    <Input
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      placeholder="Ví dụ: 01/2026/QC-NB"
                      className="bg-white border-hairline text-xs md:text-sm font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-obsidian-800 block">
                      Loại Văn bản
                    </label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value as LegalDocumentType)}
                      className="h-10 px-3 py-1.5 rounded border border-hairline bg-parchment-50 text-xs font-mono text-obsidian-800 focus:outline-none focus:ring-1 focus:ring-obsidian-500 w-full"
                    >
                      {Object.entries(LEGAL_DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-semibold text-obsidian-800 block">
                      Nội dung toàn văn quy chuẩn / điều khoản *
                    </label>
                    <span className="text-[11px] font-mono text-obsidian-400">
                      Tự động nhận diện Chương I, Điều 1, Khoản 1, Điểm a...
                    </span>
                  </div>
                  <Textarea
                    value={manualContent}
                    onChange={(e) => setManualContent(e.target.value)}
                    placeholder={`Chương I\nQUY ĐỊNH CHUNG\n\nĐiều 1. Phạm vi điều chỉnh\n1. Quy định này áp dụng đối với...\n2. Các đối tượng liên quan có trách nhiệm...\n\nĐiều 2. Biện pháp thực hiện\n...`}
                    rows={12}
                    required
                    className="font-serif text-sm leading-relaxed bg-parchment-50 border-hairline"
                  />
                </div>
              </CardContent>

              <CardFooter className="flex justify-end gap-3 border-t border-hairline p-4 bg-parchment-50">
                <Button
                  type="submit"
                  variant="gilt"
                  isLoading={isLoading}
                  disabled={!title || !manualContent}
                  icon={<FileText className="w-3.5 h-3.5" />}
                  className="text-xs font-medium tracking-wide h-10 px-6"
                >
                  Lưu & Đánh Chỉ Mục Bản Gốc
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
