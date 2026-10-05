'use client';

import React, { useState } from 'react';
import { LegalNodeType } from '@legal-rag/shared';
import { ChevronRight, ChevronDown, Copy, Check, BookOpen } from 'lucide-react';

interface NodeData {
  id: string;
  type: LegalNodeType;
  number?: string;
  title?: string;
  content: string;
  hierarchyPath?: string;
  page?: number;
  children?: NodeData[];
}

interface HierarchyTreeProps {
  nodes: NodeData[];
}

function NodeItem({ node, level = 0 }: { node: NodeData; level?: number }) {
  const [isOpen, setIsOpen] = useState(level < 2);
  const [copied, setCopied] = useState(false);

  const hasChildren = node.children && node.children.length > 0;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(node.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const typeLabels: Record<string, string> = {
    PART: 'Phần',
    CHAPTER: 'Chương',
    SECTION: 'Mục',
    ARTICLE: 'Điều',
    CLAUSE: 'Khoản',
    POINT: 'Điểm',
    PREAMBLE: 'Lời mở đầu',
    APPENDIX: 'Phụ lục',
    GENERAL: 'Quy định chung',
  };

  const isMajorDivision = node.type === 'PART' || node.type === 'CHAPTER';
  const isArticle = node.type === 'ARTICLE';

  return (
    <div className="select-text">
      <div
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        className={`group flex items-start gap-2.5 py-2.5 px-3 rounded transition-all duration-150 border border-transparent ${
          hasChildren ? 'cursor-pointer hover:bg-parchment-100/90 hover:border-hairline' : 'cursor-default'
        } ${level > 0 ? 'ml-3.5 pl-3 border-l-2 border-hairline/70' : ''}`}
      >
        {/* Toggle icon */}
        <div className="pt-1 shrink-0 text-obsidian-400 group-hover:text-obsidian-800 transition-colors">
          {hasChildren ? (
            isOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-obsidian-300 block mx-1.5 my-1" />
          )}
        </div>

        {/* Node content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-mono tracking-wide border uppercase ${
                isMajorDivision
                  ? 'bg-obsidian-900 text-parchment-100 border-obsidian-950 font-semibold'
                  : isArticle
                  ? 'bg-gilt-50 text-gilt-800 border-gilt-300 font-bold'
                  : 'bg-parchment-150 text-obsidian-700 border-hairline'
              }`}
            >
              {typeLabels[node.type] || node.type} {node.number ? node.number : ''}
            </span>

            {node.title && (
              <span
                className={`text-obsidian-900 ${
                  isMajorDivision
                    ? 'font-serif text-base font-bold text-obsidian-950'
                    : isArticle
                    ? 'font-serif text-sm font-semibold'
                    : 'font-sans text-xs font-medium text-obsidian-800'
                }`}
              >
                {node.title}
              </span>
            )}

            {node.page && (
              <span className="text-[10px] font-mono text-obsidian-400 ml-auto">Folio {node.page}</span>
            )}
          </div>

          <p
            className={`leading-relaxed text-obsidian-700 whitespace-pre-wrap ${
              isArticle ? 'font-serif text-sm text-obsidian-900/90' : 'font-sans text-xs'
            }`}
          >
            {node.content}
          </p>
        </div>

        {/* Copy action */}
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-obsidian-400 hover:text-obsidian-900 hover:bg-parchment-200 transition-all shrink-0"
          title="Sao chép trích lục"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-sage-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Children */}
      {hasChildren && isOpen && (
        <div className="mt-1 space-y-1">
          {node.children!.map((child) => (
            <NodeItem key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function HierarchyTree({ nodes }: HierarchyTreeProps) {
  if (!nodes || nodes.length === 0) {
    return (
      <div className="p-10 text-center border border-dashed border-hairline rounded bg-parchment-50">
        <BookOpen className="w-8 h-8 mx-auto mb-2.5 text-obsidian-300" />
        <p className="font-serif text-obsidian-800 text-sm font-medium">Chưa có Cây Phân Cấp Quy Phạm</p>
        <p className="text-xs text-obsidian-500 mt-1">Văn bản đang trong tiến trình bóc tách cấu trúc hoặc là dạng tóm lược.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 bg-parchment-50 p-3 rounded border border-hairline/80">
      {nodes.map((node) => (
        <NodeItem key={node.id} node={node} level={0} />
      ))}
    </div>
  );
}
