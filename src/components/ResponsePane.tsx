import type { ResultQuadrant, RunResult, Scenario } from '../types';

interface Props {
  scenario: Scenario | null;
  result: RunResult | null;
  onRun: () => void;
  isRunning: boolean;
  mode: 'simulation' | 'live';
}

const VERDICT_META: Record<ResultQuadrant, { label: string; icon: string; color: string; bg: string }> = {
  caught: {
    label: 'תפסת! (Caught)',
    icon: '✓',
    color: 'text-success',
    bg: 'bg-success/10 border-success/40',
  },
  missed: {
    label: 'דליפה (Missed)',
    icon: '✕',
    color: 'text-danger',
    bg: 'bg-danger/10 border-danger/40',
  },
  false_positive: {
    label: 'חסמת מדי (False Positive)',
    icon: '!',
    color: 'text-warning',
    bg: 'bg-warning/10 border-warning/40',
  },
  correct_ignore: {
    label: 'התעלמת בצדק (Correct Ignore)',
    icon: '○',
    color: 'text-text-muted',
    bg: 'bg-bg-panel border-border',
  },
};

export function ResponsePane({ scenario, result, onRun, isRunning, mode }: Props) {
  if (!scenario) {
    return (
      <div className="flex flex-col h-full bg-bg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-elevated">
          <div className="flex items-center gap-2" dir="rtl">
            <div className="w-2 h-2 rounded-full bg-text-dim" />
            <span className="text-sm font-medium">תגובת המודל</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8" dir="rtl">
          <p className="text-text-dim text-sm text-center max-w-xs">
            בחרי תרחיש מהרשימה והריצי אותו כדי לראות איך ה-Skill שכתבת מגיבה.
          </p>
        </div>
      </div>
    );
  }

  const meta = result ? VERDICT_META[result.result] : null;

  return (
    <div className="flex flex-col h-full bg-bg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-elevated">
        <div className="flex items-center gap-2" dir="rtl">
          <div className="w-2 h-2 rounded-full bg-text-dim" />
          <span className="text-sm font-medium">תגובת המודל</span>
          <span className="text-[10px] text-text-dim font-mono code-ltr">{mode}</span>
        </div>
        <button
          onClick={onRun}
          disabled={isRunning}
          className="text-xs px-3 py-1 rounded-md bg-blue hover:bg-blue-dim text-white font-medium transition-colors disabled:opacity-50"
        >
          {isRunning ? '…' : result ? 'הריצי שוב' : 'הריצי'}
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4" dir="rtl">
        <section>
          <h3 className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wide">{scenario.title}</h3>
          {scenario.context && <p className="text-sm text-text-muted mb-3">{scenario.context}</p>}
          <div className="rounded-lg border border-border bg-bg-panel p-3">
            <div className="text-[10px] text-text-dim mb-2 uppercase tracking-wider">הודעת המשתמש</div>
            <pre className="text-xs code-ltr text-text whitespace-pre-wrap break-words">{scenario.userMessage}</pre>
          </div>
        </section>

        {result && meta && (
          <section className="animate-slide-up">
            <div className={`rounded-lg border p-4 ${meta.bg}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-lg font-bold ${meta.color}`}>{meta.icon}</span>
                <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
              </div>
              <div className="text-[10px] text-text-dim mb-1 uppercase tracking-wider">תגובת המודל</div>
              <pre className="text-xs code-ltr text-text whitespace-pre-wrap mb-3">{result.modelResponse}</pre>
              {result.matchedTriggers.length > 0 && (
                <>
                  <div className="text-[10px] text-text-dim mb-1 uppercase tracking-wider">Triggers שזוהו</div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matchedTriggers.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-mono code-ltr px-1.5 py-0.5 rounded bg-bg-panel border border-border-strong text-text-muted"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {!result && (
          <div className="text-center text-text-dim text-sm py-8">לחצי "הריצי" כדי לראות איך ה-Skill מגיבה לתרחיש הזה.</div>
        )}
      </div>
    </div>
  );
}
