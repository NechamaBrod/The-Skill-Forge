import { useEffect, useMemo, useState } from 'react';
import JSZip from 'jszip';
import { EditorPane } from './components/EditorPane';
import { ScenariosPane } from './components/ScenariosPane';
import { ResponsePane } from './components/ResponsePane';
import { SummaryModal } from './components/SummaryModal';
import { SCENARIOS } from './data/scenarios';
import { STARTER_SKILL } from './data/starterSkill';
import type { RunResult } from './types';
import { computeMetrics, recommendations, runScenario } from './lib/simulator';

const STORAGE_KEY = 'skill-forge:skill-md:v1';

export default function App() {
  const [skill, setSkill] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? STARTER_SKILL;
    } catch {
      return STARTER_SKILL;
    }
  });
  const [results, setResults] = useState<Map<string, RunResult>>(new Map());
  const [selectedId, setSelectedId] = useState<string | null>(SCENARIOS[0]?.id ?? null);
  const [isRunning, setIsRunning] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, skill);
    } catch {
      // ignore quota errors
    }
  }, [skill]);

  const selectedScenario = useMemo(
    () => SCENARIOS.find((s) => s.id === selectedId) ?? null,
    [selectedId],
  );
  const selectedResult = selectedScenario ? results.get(selectedScenario.id) ?? null : null;

  function handleRunOne() {
    if (!selectedScenario) return;
    setIsRunning(true);
    setTimeout(() => {
      const r = runScenario(skill, selectedScenario);
      setResults((prev) => {
        const next = new Map(prev);
        next.set(r.scenarioId, r);
        return next;
      });
      setIsRunning(false);
    }, 280);
  }

  async function handleRunAll() {
    setIsRunning(true);
    const next = new Map<string, RunResult>();
    for (const s of SCENARIOS) {
      next.set(s.id, runScenario(skill, s));
      await new Promise((r) => setTimeout(r, 90));
      setResults(new Map(next));
    }
    setIsRunning(false);
    setShowSummary(true);
  }

  function handleReset() {
    if (!confirm('לאפס את ה-SKILL.md ולנקות תוצאות?')) return;
    setSkill(STARTER_SKILL);
    setResults(new Map());
    setShowSummary(false);
  }

  async function handleDownload() {
    const zip = new JSZip();
    const folder = zip.folder('secret-guard');
    folder?.file('SKILL.md', skill);
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'secret-guard.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const resultsArr = Array.from(results.values());
  const metrics = useMemo(() => computeMetrics(resultsArr), [resultsArr]);
  const tips = useMemo(() => recommendations(resultsArr, SCENARIOS), [resultsArr]);

  return (
    <>
      <div className="app-shell h-full flex flex-col">
        <header className="flex items-center justify-between px-5 py-3 border-b border-border bg-bg-elevated">
          <div className="flex items-center gap-3" dir="rtl">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-accent to-blue flex items-center justify-center text-white font-bold text-sm">
              S
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-tight">The Skill Forge</h1>
              <p className="text-[11px] text-text-dim leading-tight">תרגול בניית Claude Skill לאבטחת מידע</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-text-dim">
            <span>Mode: <span className="text-text-muted">Simulation</span></span>
          </div>
        </header>

        <main className="flex-1 min-h-0 grid grid-cols-[1.2fr_320px_1.2fr]">
          <EditorPane value={skill} onChange={setSkill} onReset={handleReset} onDownload={handleDownload} />
          <ScenariosPane
            scenarios={SCENARIOS}
            selectedId={selectedId}
            results={results}
            onSelect={setSelectedId}
            onRunAll={handleRunAll}
            onShowSummary={() => setShowSummary(true)}
            isRunning={isRunning}
          />
          <ResponsePane
            scenario={selectedScenario}
            result={selectedResult}
            onRun={handleRunOne}
            isRunning={isRunning}
          />
        </main>
      </div>

      <div className="desktop-only-overlay">
        <div className="max-w-sm" dir="rtl">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent to-blue mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl">
            S
          </div>
          <h1 className="text-lg font-semibold mb-2">The Skill Forge</h1>
          <p className="text-sm text-text-muted">
            הכלי הזה דורש מסך רחב (1000px+). פתחי אותו במחשב נייח/נייד כדי לתרגל.
          </p>
        </div>
      </div>

      {showSummary && (
        <SummaryModal
          metrics={metrics}
          tips={tips}
          onClose={() => setShowSummary(false)}
          onDownload={handleDownload}
          onReset={handleReset}
        />
      )}
    </>
  );
}
