import { QUADRANT_LABEL, type Score } from '../lib/simulator';

interface Props {
  score: Score;
  tips: string[];
  onClose: () => void;
  onDownload: () => void;
  onReset: () => void;
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs text-text-muted">{label}</span>
        <span className="text-2xl font-bold font-mono code-ltr">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-bg-panel overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function SummaryModal({ score, tips, onClose, onDownload, onReset }: Props) {
  const { precision, recall, quadrant, caught, missed, falsePositive, correctIgnore } = score;
  const ql = QUADRANT_LABEL[quadrant];

  return (
    <div
      className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-bg-elevated border border-border-strong rounded-xl p-6 shadow-2xl glow-accent animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold">סיכום הריצה</h2>
          <button
            onClick={onClose}
            className="text-text-dim hover:text-text text-2xl leading-none"
            aria-label="סגרי"
          >
            ×
          </button>
        </div>
        <p className={`text-sm font-semibold mb-6 ${ql.color}`}>{ql.he}</p>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <Bar label="Precision — דיוק החסימות" value={precision} color="bg-accent" />
          <Bar label="Recall — אחוז התפיסה" value={recall} color="bg-blue" />
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6">
          <div className="rounded-lg border border-success/30 bg-success/5 p-3">
            <div className="text-[10px] text-text-dim uppercase tracking-wider mb-1">Caught</div>
            <div className="text-2xl font-bold text-success font-mono code-ltr">{caught}</div>
          </div>
          <div className="rounded-lg border border-danger/30 bg-danger/5 p-3">
            <div className="text-[10px] text-text-dim uppercase tracking-wider mb-1">Missed</div>
            <div className="text-2xl font-bold text-danger font-mono code-ltr">{missed}</div>
          </div>
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
            <div className="text-[10px] text-text-dim uppercase tracking-wider mb-1">False Positive</div>
            <div className="text-2xl font-bold text-warning font-mono code-ltr">{falsePositive}</div>
          </div>
          <div className="rounded-lg border border-border bg-bg-panel p-3">
            <div className="text-[10px] text-text-dim uppercase tracking-wider mb-1">Correct Ignore</div>
            <div className="text-2xl font-bold text-text-muted font-mono code-ltr">{correctIgnore}</div>
          </div>
        </div>

        {tips.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-text-muted mb-2 uppercase tracking-wide">המלצות</h3>
            <ul className="space-y-2">
              {tips.map((t, i) => (
                <li key={i} className="text-sm text-text flex gap-2">
                  <span className="text-accent shrink-0">→</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onReset}
            className="px-4 py-2 rounded-md text-sm text-text-muted hover:text-text hover:bg-bg-panel transition-colors"
          >
            איפוס
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm border border-border-strong hover:bg-bg-panel transition-colors"
          >
            ערכי שוב
          </button>
          <button
            onClick={onDownload}
            className="px-4 py-2 rounded-md text-sm bg-accent hover:bg-accent-dim text-white font-medium transition-colors"
          >
            הורידי כ-ZIP
          </button>
        </div>
      </div>
    </div>
  );
}
