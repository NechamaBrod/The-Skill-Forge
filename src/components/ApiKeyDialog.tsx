import { useState } from 'react';

interface Props {
  initial?: string;
  onSave: (key: string) => void;
  onCancel: () => void;
}

export function ApiKeyDialog({ initial = '', onSave, onCancel }: Props) {
  const [val, setVal] = useState(initial);
  const valid = val.trim().startsWith('sk-ant-');

  return (
    <div
      className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-bg-elevated border border-border-strong rounded-xl p-6 shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <h2 className="text-lg font-bold mb-1">Live Mode — Anthropic API Key</h2>
        <p className="text-xs text-text-muted mb-4">
          המפתח נשמר ב-localStorage של הדפדפן בלבד ונשלח רק ל-<span className="code-ltr font-mono">api.anthropic.com</span>.
        </p>
        <input
          type="password"
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && valid) onSave(val.trim());
            if (e.key === 'Escape') onCancel();
          }}
          placeholder="sk-ant-..."
          className="w-full font-mono code-ltr text-sm px-3 py-2 rounded-md bg-bg border border-border focus:border-accent outline-none mb-2"
        />
        <p className="text-[11px] text-text-dim mb-5">
          השיגי מפתח ב-<a href="https://console.anthropic.com/" target="_blank" rel="noreferrer" className="text-accent hover:underline code-ltr">console.anthropic.com</a>.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md text-sm text-text-muted hover:text-text hover:bg-bg transition-colors"
          >
            ביטול
          </button>
          <button
            onClick={() => valid && onSave(val.trim())}
            disabled={!valid}
            className="px-4 py-2 rounded-md text-sm bg-accent hover:bg-accent-dim text-white font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            שמרי והפעילי
          </button>
        </div>
      </div>
    </div>
  );
}
