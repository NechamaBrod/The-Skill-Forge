import { useEffect, useRef } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

/**
 * Lightweight code editor: a textarea with line numbers and tab handling.
 * Chose this over Monaco to avoid the worker/CDN bundling pain and to
 * guarantee the editor is editable in every environment.
 */
export function CodeEditor({ value, onChange, placeholder }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lines = value === '' ? [''] : value.split('\n');

  useEffect(() => {
    const ta = textareaRef.current;
    const ln = lineNumbersRef.current;
    if (!ta || !ln) return;
    const sync = () => {
      ln.scrollTop = ta.scrollTop;
    };
    ta.addEventListener('scroll', sync);
    return () => ta.removeEventListener('scroll', sync);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = value.slice(0, start) + '  ' + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  }

  return (
    <div className="relative h-full w-full flex bg-bg overflow-hidden code-ltr">
      <div
        ref={lineNumbersRef}
        className="select-none text-text-dim text-right pr-2 pl-3 py-3 bg-bg border-l border-border overflow-hidden"
        style={{
          fontFamily: 'JetBrains Mono, ui-monospace, monospace',
          fontSize: '13px',
          lineHeight: '1.5',
          minWidth: '3rem',
        }}
      >
        {lines.map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        spellCheck={false}
        wrap="off"
        className="flex-1 bg-bg text-text outline-none resize-none px-3 py-3 leading-relaxed"
        style={{
          fontFamily: 'JetBrains Mono, ui-monospace, monospace',
          fontSize: '13px',
          lineHeight: '1.5',
          whiteSpace: 'pre',
          overflow: 'auto',
          direction: 'ltr',
          textAlign: 'left',
        }}
      />
    </div>
  );
}
