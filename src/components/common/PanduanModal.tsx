import React from 'react';
import { X, BookOpen } from 'lucide-react';
import panduanRaw from '../../data/panduan.md?raw';

interface PanduanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Very small markdown-ish renderer, purpose-built for the structure of
 * panduan.md (#/## headings, tables, bullet lists, **bold**, paragraphs).
 * Not a general markdown engine — just enough to render our one guide file
 * nicely without pulling in a full markdown dependency.
 */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={`${keyPrefix}-${i}`} className="px-1 py-0.5 bg-slate-100 rounded text-[11px] font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>;
  });
}

function renderMarkdown(md: string): React.ReactNode {
  const lines = md.split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let listBuffer: string[] = [];
  let orderedListBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length > 0) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="list-disc pl-5 space-y-1 my-2 text-slate-700">
          {listBuffer.map((item, idx) => (
            <li key={idx}>{renderInline(item, `li-${blocks.length}-${idx}`)}</li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
    if (orderedListBuffer.length > 0) {
      blocks.push(
        <ol key={`ol-${blocks.length}`} className="list-decimal pl-5 space-y-1 my-2 text-slate-700">
          {orderedListBuffer.map((item, idx) => (
            <li key={idx}>{renderInline(item, `oli-${blocks.length}-${idx}`)}</li>
          ))}
        </ol>
      );
      orderedListBuffer = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      flushList();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push(
        <pre key={`code-${i}`} className="bg-slate-900 text-slate-100 rounded-lg p-3 my-2 overflow-x-auto text-[11px] font-mono leading-relaxed">
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    const orderedMatch = line.trim().match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      orderedListBuffer.push(orderedMatch[1]);
      i++;
      continue;
    }

    if (line.startsWith('# ')) {
      flushList();
      blocks.push(
        <h1 key={i} className="text-lg font-extrabold text-slate-900 mt-1 mb-2">
          {renderInline(line.slice(2), `h1-${i}`)}
        </h1>
      );
      i++;
      continue;
    }

    if (line.startsWith('## ')) {
      flushList();
      blocks.push(
        <h2 key={i} className="text-sm font-bold text-blue-700 mt-5 mb-2 pb-1 border-b border-slate-200">
          {renderInline(line.slice(3), `h2-${i}`)}
        </h2>
      );
      i++;
      continue;
    }

    if (line.trim().startsWith('- ')) {
      listBuffer.push(line.trim().slice(2));
      i++;
      continue;
    }

    if (line.trim().startsWith('|')) {
      flushList();
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      const rows = tableLines
        .filter((l) => !/^\|[\s-:|]+\|$/.test(l))
        .map((l) =>
          l
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim())
        );
      const [header, ...body] = rows;
      blocks.push(
        <div key={`table-${i}`} className="overflow-x-auto my-3">
          <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100">
              <tr>
                {header.map((h, idx) => (
                  <th key={idx} className="p-2 text-left font-bold text-slate-700 border-b border-slate-200">
                    {renderInline(h, `th-${idx}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rIdx) => (
                <tr key={rIdx} className="border-t border-slate-100">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2 text-slate-600 align-top">
                      {renderInline(cell, `td-${rIdx}-${cIdx}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (line.trim() === '') {
      flushList();
      i++;
      continue;
    }

    flushList();
    blocks.push(
      <p key={i} className="text-xs text-slate-600 leading-relaxed my-2">
        {renderInline(line, `p-${i}`)}
      </p>
    );
    i++;
  }

  flushList();
  return blocks;
}

export const PanduanModal: React.FC<PanduanModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-[#0F2747] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4.5 h-4.5" />
            <h2 className="text-sm font-bold tracking-tight">Panduan Penggunaan</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto custom-scrollbar">{renderMarkdown(panduanRaw)}</div>
      </div>
    </div>
  );
};
