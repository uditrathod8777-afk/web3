import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`prose-container space-y-3 leading-relaxed text-slate-100 ${className}`}>
      {renderMarkdownToElements(content)}
    </div>
  );
};

// Copyable Code Block component
const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const displayLang = language || 'code';

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-slate-700/80 bg-[#0d1117] shadow-sm">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#161b22] border-b border-slate-800 text-xs text-slate-400 font-mono">
        <span className="uppercase tracking-wider font-semibold text-[11px] text-slate-300">
          {displayLang}
        </span>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-[13px] leading-relaxed font-mono text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// Parser that splits content into blocks: code, table, lists, headings, quotes, paragraphs
function renderMarkdownToElements(raw: string): React.ReactNode[] {
  if (!raw) return [];

  const elements: React.ReactNode[] = [];
  const lines = raw.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Check for fenced code block ```
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <CodeBlock key={`code-${i}`} language={lang} code={codeLines.join('\n')} />
      );
      continue;
    }

    // Check for Markdown Table
    if (line.includes('|') && lines[i + 1] && lines[i + 1].includes('|') && lines[i + 1].includes('-')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      elements.push(renderTable(tableLines, `table-${i}`));
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-xl md:text-2xl font-bold tracking-tight text-white mt-4 mb-2">
          {renderInline(line.slice(2))}
        </h1>
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-lg md:text-xl font-semibold tracking-tight text-white mt-3 mb-1.5">
          {renderInline(line.slice(3))}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-base md:text-lg font-semibold text-slate-100 mt-2.5 mb-1">
          {renderInline(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith('#### ')) {
      elements.push(
        <h4 key={`h4-${i}`} className="text-sm md:text-base font-semibold text-slate-200 mt-2 mb-1">
          {renderInline(line.slice(5))}
        </h4>
      );
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="my-2 pl-3.5 border-l-2 border-indigo-500/70 text-slate-300 italic text-sm"
        >
          {quoteLines.map((ql, idx) => (
            <p key={idx}>{renderInline(ql)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Horizontal Rule
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(line.trim())) {
      elements.push(<hr key={`hr-${i}`} className="my-4 border-slate-700/60" />);
      i++;
      continue;
    }

    // Unordered List
    if (/^[\*\-\+]\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^[\*\-\+]\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^[\*\-\+]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-2 space-y-1 list-disc list-inside text-slate-200 pl-1">
          {listItems.map((item, idx) => (
            <li key={idx} className="text-sm md:text-[14.5px]">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered List
    if (/^\d+\.\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-2 space-y-1 list-decimal list-inside text-slate-200 pl-1">
          {listItems.map((item, idx) => (
            <li key={idx} className="text-sm md:text-[14.5px]">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Regular Paragraph
    const paraLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('> ') &&
      !/^[\*\-\+]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !lines[i].includes('|')
    ) {
      paraLines.push(lines[i]);
      i++;
    }

    elements.push(
      <p key={`p-${i}`} className="my-1.5 text-sm md:text-[14.5px] text-slate-200 leading-relaxed">
        {renderInline(paraLines.join(' '))}
      </p>
    );
  }

  return elements;
}

// Render markdown tables
function renderTable(lines: string[], key: string): React.ReactNode {
  if (lines.length < 2) return null;

  const parseRow = (line: string) =>
    line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());

  const headers = parseRow(lines[0]);
  const rows = lines.slice(2).map(parseRow);

  return (
    <div key={key} className="my-3 overflow-x-auto rounded-lg border border-slate-700/80">
      <table className="min-w-full divide-y divide-slate-700 text-left text-xs md:text-sm">
        <thead className="bg-slate-800/80 text-slate-200 font-semibold">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 border-r border-slate-700/60 last:border-r-0">
                {renderInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-900/60 text-slate-300">
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
              {row.map((c, cIdx) => (
                <td key={cIdx} className="px-3 py-2 border-r border-slate-800/60 last:border-r-0">
                  {renderInline(c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Inline formatting: bold, italic, inline code, links
function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  // Split by inline code `code`
  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={index}
          className="mx-1 px-1.5 py-0.5 rounded text-[12.5px] font-mono bg-slate-800/90 text-indigo-300 border border-slate-700/70"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Process bold **text**, italic *text*, links [label](url)
    return parseFormattedInline(part, index);
  });
}

function parseFormattedInline(text: string, outerKey: number): React.ReactNode {
  // Regex for bold **text**, italics *text*, and links [text](url)
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(regex);

  return (
    <span key={outerKey}>
      {parts.map((p, idx) => {
        if (p.startsWith('**') && p.endsWith('**') && p.length >= 4) {
          return (
            <strong key={idx} className="font-semibold text-white">
              {p.slice(2, -2)}
            </strong>
          );
        }
        if (p.startsWith('*') && p.endsWith('*') && p.length >= 2) {
          return (
            <em key={idx} className="italic text-slate-200">
              {p.slice(1, -1)}
            </em>
          );
        }
        const linkMatch = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          return (
            <a
              key={idx}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
            >
              {linkMatch[1]}
            </a>
          );
        }
        return p;
      })}
    </span>
  );
}
