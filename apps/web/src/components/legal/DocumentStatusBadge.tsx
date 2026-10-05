import React from 'react';
import { IngestionStatus, INGESTION_STATUS_LABELS } from '@legal-rag/shared';

interface DocumentStatusBadgeProps {
  status: IngestionStatus | string;
  className?: string;
}

export function DocumentStatusBadge({ status, className }: DocumentStatusBadgeProps) {
  const label =
    INGESTION_STATUS_LABELS[status as IngestionStatus] || status || 'Chưa rõ';

  switch (status) {
    case 'INDEXED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono tracking-wide uppercase border bg-sage-50 text-sage-800 border-sage-200/80 font-medium ${className || ''}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sage-600" />
          {label}
        </span>
      );
    case 'PROCESSING':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono tracking-wide uppercase border bg-gilt-50 text-gilt-800 border-gilt-200 font-medium ${className || ''}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-gilt-500 animate-pulse" />
          {label}
        </span>
      );
    case 'FAILED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono tracking-wide uppercase border bg-rose-50 text-rose-800 border-rose-200 font-medium ${className || ''}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
          {label}
        </span>
      );
    case 'PENDING':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono tracking-wide uppercase border bg-parchment-100 text-slate-700 border-hairline font-medium ${className || ''}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          {label}
        </span>
      );
  }
}
