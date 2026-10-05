import React from 'react';
import { LegalDocumentType, LEGAL_DOCUMENT_TYPE_LABELS } from '@legal-rag/shared';

interface DocumentTypeBadgeProps {
  type: LegalDocumentType | string;
  className?: string;
}

export function DocumentTypeBadge({ type, className }: DocumentTypeBadgeProps) {
  const label =
    LEGAL_DOCUMENT_TYPE_LABELS[type as LegalDocumentType] || type || 'Khác';

  let badgeStyle =
    'bg-parchment-200 text-slate-800 border-hairline';

  switch (type) {
    case 'CONSTITUTION':
    case 'LAW':
    case 'CODE':
      badgeStyle = 'bg-obsidian-900 text-white border-obsidian-950';
      break;
    case 'DECREE':
      badgeStyle = 'bg-gilt-100/80 text-gilt-800 border-gilt-300/80';
      break;
    case 'CIRCULAR':
      badgeStyle = 'bg-sage-100/90 text-sage-800 border-sage-200';
      break;
    case 'DECISION':
    case 'RESOLUTION':
      badgeStyle = 'bg-slate-100 text-slate-800 border-slate-200';
      break;
    default:
      badgeStyle = 'bg-parchment-100 text-slate-700 border-hairline';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono tracking-wide uppercase border font-medium ${badgeStyle} ${className || ''}`}
    >
      {label}
    </span>
  );
}
