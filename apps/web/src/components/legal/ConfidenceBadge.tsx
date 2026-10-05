import React from 'react';
import { ShieldCheck, ShieldAlert, AlertCircle } from 'lucide-react';

interface ConfidenceBadgeProps {
  confidence: 'high' | 'medium' | 'low';
  className?: string;
}

export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  switch (confidence) {
    case 'high':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono tracking-wide uppercase bg-sage-50 text-sage-800 border border-sage-200/90 font-medium ${className || ''}`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-sage-600 shrink-0" />
          <span>Thẩm định: Đầy đủ Căn cứ</span>
        </span>
      );
    case 'medium':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono tracking-wide uppercase bg-gilt-50 text-gilt-800 border border-gilt-200/90 font-medium ${className || ''}`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-gilt-600 shrink-0" />
          <span>Thẩm định: Căn cứ Tham khảo</span>
        </span>
      );
    case 'low':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono tracking-wide uppercase bg-rose-50 text-rose-800 border border-rose-200 font-medium ${className || ''}`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>Thẩm định: Chưa đủ Căn cứ Pháp lý</span>
        </span>
      );
  }
}
