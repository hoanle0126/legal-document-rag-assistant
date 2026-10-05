'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import {
  Cpu,
  Database,
  Sliders,
  CheckCircle2,
  Save,
  Activity,
  Layers,
  Shield,
  Server,
} from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({
    llmProvider: 'mock',
    embeddingProvider: 'mock',
    topK: 5,
    similarityThreshold: 0.45,
    chunkSize: 500,
    chunkOverlap: 50,
  });
  const [health, setHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const [settingsData, healthData] = await Promise.all([
          api.settings.get().catch(() => ({})),
          api.health.get().catch(() => null),
        ]);

        if (settingsData && Object.keys(settingsData).length > 0) {
          setSettings((prev: any) => ({ ...prev, ...settingsData }));
        }
        setHealth(healthData);
      } catch (err) {
        console.error('Lỗi nạp cấu hình hệ thống:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await api.settings.update(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu cấu hình');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-parchment-50/50">
      <Header
        title="Tham Số Điều Hành & Giám Sát Hạ Tầng"
        subtitle="Quản lý bộ chuyển đổi Provider LLM/Embeddings, ngưỡng tương đồng vector và trạng thái cụm dịch vụ"
      />

      <div className="flex-1 p-6 md:p-8 space-y-7 max-w-5xl mx-auto w-full">
        {savedSuccess && (
          <div className="p-4 rounded border border-sage-300 bg-sage-50 text-sage-900 text-xs flex items-center gap-3 shadow-subtle animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-sage-700 shrink-0" />
            <span className="font-serif font-bold text-sm">Cấu hình điều hành đã được cập nhật thành công!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-7">
          {/* AI Providers Section */}
          <Card className="bg-white">
            <CardHeader className="border-b border-hairline bg-parchment-100/50">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-obsidian-700" />
                <CardTitle className="font-serif text-base text-obsidian-950">
                  Mô Hình Ngôn Ngữ & Bộ Chuyển Đổi (AI Providers)
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-obsidian-500 font-sans">
                Kiến trúc Provider Abstraction cho phép hoán chuyển nhà cung cấp mô hình mà không ảnh hưởng luồng RAG.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-mono font-semibold text-obsidian-800 block">
                    LLM Provider Hiện tại
                  </label>
                  <select
                    value={settings.llmProvider}
                    onChange={(e) =>
                      setSettings({ ...settings, llmProvider: e.target.value })
                    }
                    className="h-10 px-3 py-1.5 rounded border border-hairline bg-parchment-50 text-xs font-mono text-obsidian-800 focus:outline-none focus:ring-1 focus:ring-obsidian-500 w-full"
                  >
                    <option value="mock">
                      Mock Provider (Xác thực nội bộ - Thích hợp kiểm thử & Demo offline)
                    </option>
                    <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                    <option value="gemini">Google Gemini (Gemini 1.5 Pro / Flash)</option>
                    <option value="anthropic">Anthropic Claude (Claude 3.5 Sonnet)</option>
                  </select>
                  <p className="text-[11px] text-obsidian-500 font-mono">
                    Khóa API được mã hóa bảo mật từ biến môi trường máy chủ (.env), không truyền tải về máy khách.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono font-semibold text-obsidian-800 block">
                    Embedding Vector Provider
                  </label>
                  <select
                    value={settings.embeddingProvider}
                    onChange={(e) =>
                      setSettings({ ...settings, embeddingProvider: e.target.value })
                    }
                    className="h-10 px-3 py-1.5 rounded border border-hairline bg-parchment-50 text-xs font-mono text-obsidian-800 focus:outline-none focus:ring-1 focus:ring-obsidian-500 w-full"
                  >
                    <option value="mock">Mock Embeddings (1536 chiều)</option>
                    <option value="openai">OpenAI text-embedding-3-small (1536 chiều)</option>
                    <option value="gemini">Google text-embedding-004</option>
                  </select>
                  <p className="text-[11px] text-obsidian-500 font-mono">
                    Không gian vector cố định 1536 chiều tương thích chỉ mục HNSW trên pgvector.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RAG Retrieval Parameters */}
          <Card className="bg-white">
            <CardHeader className="border-b border-hairline bg-parchment-100/50">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-gilt-700" />
                <CardTitle className="font-serif text-base text-obsidian-950">
                  Tham Số Đối Soát Ngữ Nghĩa Hybrid
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-obsidian-500 font-sans">
                Hiệu chỉnh số lượng đoạn trích (Top-K) và ngưỡng tin cậy tương đồng cosine vector.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-obsidian-800">
                      Số đoạn trích thu thập (Top-K):
                    </span>
                    <span className="font-mono font-bold text-obsidian-950 text-sm px-2 py-0.5 rounded bg-parchment-200">
                      {settings.topK}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={15}
                    value={settings.topK}
                    onChange={(e) =>
                      setSettings({ ...settings, topK: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-obsidian-900 cursor-pointer"
                  />
                  <p className="text-[11px] text-obsidian-500 font-mono">
                    Số chunks điều khoản phù hợp nhất được gửi vào ngữ cảnh lập luận (Khuyến nghị: 3 - 6).
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-obsidian-800">
                      Ngưỡng tương đồng vector tối thiểu:
                    </span>
                    <span className="font-mono font-bold text-gilt-800 text-sm px-2 py-0.5 rounded bg-gilt-100">
                      {settings.similarityThreshold}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={0.9}
                    step={0.05}
                    value={settings.similarityThreshold}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        similarityThreshold: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-gilt-700 cursor-pointer"
                  />
                  <p className="text-[11px] text-obsidian-500 font-mono">
                    Các chunks có độ tương đồng cosine dưới ngưỡng này sẽ bị loại bỏ để bảo toàn độ chính xác.
                  </p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end border-t border-hairline p-4 bg-parchment-50">
              <Button
                type="submit"
                variant="obsidian"
                isLoading={isSaving}
                icon={<Save className="w-3.5 h-3.5" />}
                className="text-xs font-mono h-10 px-6"
              >
                Lưu Tham Số Điều Hành
              </Button>
            </CardFooter>
          </Card>
        </form>

        {/* Infrastructure Health Status Card */}
        <Card className="bg-white">
          <CardHeader className="border-b border-hairline bg-parchment-100/50">
            <div className="flex items-center gap-2.5">
              <Server className="w-4 h-4 text-sage-700" />
              <CardTitle className="font-serif text-base text-obsidian-950">
                Trạng Thái Dịch Vụ & Hạ Tầng Lưu Chiểu
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-obsidian-500 font-sans">
              Kiểm tra trực tiếp các dịch vụ cơ sở dữ liệu và bảo vệ an toàn thông tin thời gian thực.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-4 rounded border border-hairline bg-parchment-50">
                <div className="flex items-center justify-between mb-1.5 text-obsidian-500">
                  <span>PostgreSQL</span>
                  <span className="w-2 h-2 rounded-full bg-sage-500" />
                </div>
                <p className="font-bold text-obsidian-950 text-sm">Port 5436</p>
                <p className="text-[11px] text-sage-700 mt-1">Đã kết nối qua Prisma ORM</p>
              </div>

              <div className="p-4 rounded border border-hairline bg-parchment-50">
                <div className="flex items-center justify-between mb-1.5 text-obsidian-500">
                  <span>pgvector</span>
                  <span className="w-2 h-2 rounded-full bg-sage-500" />
                </div>
                <p className="font-bold text-obsidian-950 text-sm">v0.8.7 (HNSW)</p>
                <p className="text-[11px] text-sage-700 mt-1">Chỉ mục Cosine kích hoạt</p>
              </div>

              <div className="p-4 rounded border border-hairline bg-parchment-50">
                <div className="flex items-center justify-between mb-1.5 text-obsidian-500">
                  <span>Redis Cache</span>
                  <span className="w-2 h-2 rounded-full bg-sage-500" />
                </div>
                <p className="font-bold text-obsidian-950 text-sm">Port 6382</p>
                <p className="text-[11px] text-sage-700 mt-1">Hàng đợi BullMQ sẵn sàng</p>
              </div>

              <div className="p-4 rounded border border-hairline bg-parchment-50">
                <div className="flex items-center justify-between mb-1.5 text-obsidian-500">
                  <span>Bảo vệ SSRF</span>
                  <span className="w-2 h-2 rounded-full bg-sage-500" />
                </div>
                <p className="font-bold text-obsidian-950 text-sm">DNS Validation</p>
                <p className="text-[11px] text-sage-700 mt-1">Chặn IP nội bộ & Cloud Metadata</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
