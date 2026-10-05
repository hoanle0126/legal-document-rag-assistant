'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Scale,
  LayoutDashboard,
  Bot,
  Files,
  UploadCloud,
  Settings,
  ShieldCheck,
  LogOut,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    {
      label: 'Tổng quan Hệ thống',
      href: '/',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      label: 'Trợ lý Pháp lý AI',
      href: '/assistant',
      icon: <Bot className="w-4 h-4" />,
      badge: 'Grounded RAG',
    },
    {
      label: 'Kho Văn bản Pháp luật',
      href: '/documents',
      icon: <Files className="w-4 h-4" />,
    },
    {
      label: 'Tiếp nhận & Nạp Văn bản',
      href: '/documents/upload',
      icon: <UploadCloud className="w-4 h-4" />,
    },
    {
      label: 'Cấu hình & Giám sát',
      href: '/settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="w-64 bg-obsidian-950 text-slate-300 flex flex-col h-screen border-r border-[#1E2638] shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1E2638] flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gilt-500/15 border border-gilt-500/30 text-gilt-400 shadow-sm">
          <Scale className="w-4 h-4 text-gilt-400" />
        </div>
        <div className="min-w-0">
          <h1 className="font-serif font-bold text-white text-[15px] tracking-tight leading-none truncate">
            Legal Intelligence
          </h1>
          <p className="text-[10px] text-gilt-400/80 font-mono tracking-wider uppercase mt-1">
            Grounded RAG Platform
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 pt-3 pb-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">
          Không gian làm việc
        </div>
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-all ${
                isActive
                  ? 'bg-white/10 text-white font-medium shadow-sm border border-white/10'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-gilt-400' : 'text-slate-500'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                    isActive
                      ? 'bg-gilt-500/20 text-gilt-300 border border-gilt-500/30'
                      : 'bg-obsidian-900 text-slate-400 border border-[#1E2638]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* API Docs Link */}
        <div className="pt-5 px-3 pb-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">
          Giao tiếp Lập trình
        </div>
        <a
          href="http://localhost:4000/api/docs"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Tài liệu Swagger API</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">/docs</span>
        </a>
      </nav>

      {/* User & Security Footer */}
      <div className="p-3 border-t border-[#1E2638] bg-obsidian-900/60 space-y-2">
        <div className="px-3 py-2 rounded-lg bg-obsidian-950/80 border border-[#1E2638] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] text-slate-300 font-mono">
              pgvector + Redis
            </span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-900/80 font-mono tracking-wider">
            ONLINE
          </span>
        </div>

        {user ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-obsidian-950/60 border border-[#1E2638]">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-medium text-white truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 truncate font-mono">{user.email}</p>
            </div>
            <button
              onClick={logout}
              title="Đăng xuất"
              className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-rose-400 transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="block text-center w-full py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-medium transition-colors"
          >
            Đăng nhập Quản trị
          </Link>
        )}
      </div>
    </aside>
  );
}
