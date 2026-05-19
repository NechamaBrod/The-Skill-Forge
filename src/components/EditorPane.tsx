import Editor from '@monaco-editor/react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onReset: () => void;
  onDownload: () => void;
}

export function EditorPane({ value, onChange, onReset, onDownload }: Props) {
  return (
    <div className="flex flex-col h-full border-l border-border bg-bg-panel">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-elevated">
        <div className="flex items-center gap-2" dir="rtl">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-sm font-medium">העורך</span>
          <span className="text-xs text-text-dim font-mono code-ltr">SKILL.md</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="text-xs px-2.5 py-1 rounded-md text-text-muted hover:text-text hover:bg-bg-panel transition-colors"
          >
            איפוס
          </button>
          <button
            onClick={onDownload}
            className="text-xs px-2.5 py-1 rounded-md bg-bg-panel border border-border hover:border-border-strong text-text-muted hover:text-text transition-colors"
          >
            הורידי ZIP
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="markdown"
          value={value}
          onChange={(v) => onChange(v ?? '')}
          theme="vs-dark"
          options={{
            fontFamily: 'JetBrains Mono, ui-monospace, monospace',
            fontSize: 13,
            minimap: { enabled: false },
            wordWrap: 'on',
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            padding: { top: 12 },
            renderLineHighlight: 'none',
          }}
        />
      </div>
    </div>
  );
}
