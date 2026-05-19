import type { RunResult, Scenario } from '../types';

interface Props {
  scenarios: Scenario[];
  selectedId: string | null;
  results: Map<string, RunResult>;
  onSelect: (id: string) => void;
  onRunAll: () => void;
  onShowSummary: () => void;
  isRunning: boolean;
}

const STATUS_DOT: Record<string, string> = {
  idle: 'bg-border-strong',
  caught: 'bg-success',
  leaked: 'bg-danger',
  'over-blocked': 'bg-warning',
  'correct-ignore': 'bg-neutral',
};

const DIFF_LABEL: Record<string, { text: string; color: string }> = {
  easy: { text: 'קל', color: 'text-success/80 border-success/30' },
  medium: { text: 'בינוני', color: 'text-warning/80 border-warning/30' },
  hard: { text: 'קשה', color: 'text-danger/80 border-danger/30' },
};

export function ScenariosPane({
  scenarios,
  selectedId,
  results,
  onSelect,
  onRunAll,
  onShowSummary,
  isRunning,
}: Props) {
  const completed = results.size;
  const total = scenarios.length;
  const allRun = completed === total;

  return (
    <div className="flex flex-col h-full border-l border-border bg-bg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-elevated">
        <div className="flex items-center gap-2" dir="rtl">
          <div className="w-2 h-2 rounded-full bg-blue" />
          <span className="text-sm font-medium">תרחישים</span>
          <span className="text-xs text-text-dim">
            {completed}/{total}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRunAll}
            disabled={isRunning}
            className="text-xs px-3 py-1 rounded-md bg-accent hover:bg-accent-dim text-white font-medium transition-colors disabled:opacity-50"
          >
            {isRunning ? 'מריצה…' : 'הריצי הכל'}
          </button>
          <button
            onClick={onShowSummary}
            disabled={!allRun}
            className="text-xs px-3 py-1 rounded-md border border-border-strong text-text hover:bg-bg-elevated transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            סיכום
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {scenarios.map((s) => {
          const result = results.get(s.id);
          const status = result?.verdict ?? 'idle';
          const isSelected = selectedId === s.id;
          const diff = DIFF_LABEL[s.difficulty];
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`w-full text-right px-4 py-3 border-b border-border/60 transition-colors block ${
                isSelected ? 'bg-bg-elevated border-r-2 border-r-accent' : 'hover:bg-bg-elevated/60'
              }`}
              dir="rtl"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
                <span className="text-sm font-medium text-text truncate flex-1">{s.title}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${diff.color}`}>{diff.text}</span>
              </div>
              {s.context && <p className="text-xs text-text-dim line-clamp-2 mr-4">{s.context}</p>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
