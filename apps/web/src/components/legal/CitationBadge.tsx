import React from 'react';
import { RetrievedCitation } from '@legal-rag/shared';
import { CheckCircle2, Bookmark } from 'lucide-react';

interface CitationBadgeProps {
  index: number;
  citation: RetrievedCitation;
  onClick: (citation: RetrievedCitation) => void;
}

export function CitationBadge({ index, citation, onClick }: CitationBadgeProps) {
  const shortDoc = citation.documentNumber || citation.documentTitle.slice(0, 26);
  const articlePart = citation.article ? `Đ.${citation.article}` : '';
  const clausePart = citation.clause ? `K.${citation.clause}` : '';

  return (
    <button
      type="button"
      onClick={() => onClick(citation)}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 my-1 mr-2 rounded-md bg-parchment-100 hover:bg-parchment-200 border border-hairline hover:border-slate-400 text-slate-800 text-xs transition-all shadow-subtle active:scale-[0.98] text-left group"
      title={`Mở hồ sơ đối chiếu căn cứ: ${citation.documentTitle}`}
    >
      <span className="flex items-center justify-center w-4 h-4 rounded bg-obsidian-900 text-white font-mono text-[10px] font-bold">
        {index}
      </span>
      <span className="max-w-[190px] truncate text-slate-700 font-sans text-xs">
        {shortDoc} {articlePart} {clausePart}
      </span>
      {citation.verified && (
        <CheckCircle2 className="w-3.5 h-3.5 text-sage-600 shrink-0 ml-0.5" />
      )}
    </button>
  );
}
