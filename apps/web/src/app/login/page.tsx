'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Scale, ShieldCheck, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('admin@legalrag.vn');
  const [password, setPassword] = useState('AdminPassword123!');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/assistant');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseDemoAccount = () => {
    setEmail('admin@legalrag.vn');
    setPassword('AdminPassword123!');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 mb-2">
            <Scale className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Legal Document RAG Assistant
          </h1>
          <p className="text-xs text-slate-400">
            Hệ thống Trợ lý Trí tuệ Nhân tạo Phục vụ Tra cứu & Thẩm định Căn cứ Pháp lý
          </p>
        </div>

        {/* Card */}
        <Card className="border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl text-slate-100">
          <CardHeader className="border-slate-800">
            <CardTitle className="text-base font-semibold text-white">
              Đăng nhập Hệ thống
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Sử dụng tài khoản Quản trị viên để quản lý văn bản và kiểm toán truy xuất
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@legalrag.vn"
                  icon={<Mail className="w-4 h-4" />}
                  required
                  className="bg-slate-950/80 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">
                  Mật khẩu
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  icon={<Lock className="w-4 h-4" />}
                  required
                  className="bg-slate-950/80 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500"
                />
              </div>

              {/* Demo Helper Button */}
              <button
                type="button"
                onClick={handleUseDemoAccount}
                className="w-full py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-[11px] text-blue-400 font-mono transition-colors text-left flex items-center justify-between"
              >
                <span>🔑 Điền tài khoản Demo: admin@legalrag.vn</span>
                <span className="text-[10px] text-slate-400 underline">Bấm để điền</span>
              </button>
            </CardContent>

            <CardFooter className="border-slate-800 pt-4 flex flex-col gap-3">
              <Button
                type="submit"
                variant="primary"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-10 shadow-lg shadow-blue-600/30"
                isLoading={isLoading}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Đăng nhập
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Bảo mật JWT, chống SSRF, xác thực trích dẫn căn cứ gốc</span>
        </div>
      </div>
    </div>
  );
}
