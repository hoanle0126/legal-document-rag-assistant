'use client';

import React from 'react';
import Link from 'next/link';
import { Bot, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function Header({ title, subtitle, action }: HeaderProps) {
  return (
    <header className="border-b border-hairline bg-[#FAF8F5]/90 backdrop-blur-md sticky top-0 z-30 px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          {title && (
            <h1 className="text-lg font-serif font-bold text-[#141A24] tracking-tight leading-tight">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-sans">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {action ? (
            action
          ) : (
            <Link href="/assistant">
              <Button
                size="sm"
                variant="primary"
                icon={<Bot className="w-3.5 h-3.5 text-gilt-400" />}
              >
                Hỏi Trợ lý Pháp lý
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
