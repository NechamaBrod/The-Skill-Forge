import { useEffect, useMemo, useState } from 'react';
import JSZip from 'jszip';
import { EditorPane } from './components/EditorPane';
import { ScenariosPane } from './components/ScenariosPane';
import { ResponsePane } from './components/ResponsePane';
import { SummaryModal } from './components/SummaryModal';
import { ApiKeyDialog } from './components/ApiKeyDialog';
import { ModeBadge } from './components/ModeBadge';
import { SCENARIOS } from './data/scenarios';
import { STARTER_SKILL } from './data/starterSkill';
import type { RunMode, RunResult, SkillContent } from './types';
import { computeScore, recommendations, runScenario } from './lib/simulator';
import { runScenarioLive, type LiveError } from './lib/liveRunner';

const SKILL_KEY = 'forge:skill:v2';
const API_KEY = 'forge:apiKey';
const MODE_KEY = 'forge:mode';

function loadSkill(): SkillContent {
  try {
    const raw = localStorage.getItem(SKILL_KEY);
    if (!raw) return { ...STARTER_SKILL };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && typeof parsed['SKILL.md'] === 'string') {
      return parsed as SkillContent;
    }
  } catch {
    // fall through
  }
  return { ...STARTER_SKILL };
}

function liveErrorMessage(msg: string): string {
  const e = msg as LiveError;
  if (e === 'INVALID_KEY') return 'ה-API key לא תקין. בדקי ב-console.anthropic.com.';
  if (e === 'RATE_LIMIT') return 'Rate limit. נסי שוב בעוד דקה, או עברי ל-Simulation.';
  return 'אין חיבור. עברתי אוטומטית ל-Simulation Mode.';
}

export default function App() {
  const [skill, setSkill] = useState<SkillContent>(loadSkill);
  const [activeFile, setActiveFile] = useState<string>('SKILL.md');
  const [results, setResults] = useState<Map<string, RunResult>>(new Map());
  const [selectedId, setSelectedId] = useState<string | null>(SCENARIOS[0]?.id ?? null);
  const [isRunning, setIsRunning] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [mode, setMode] = useState<RunMode>(
    () => (localStorage.getItem(MODE_KEY) === 'live' ? 'live' : 'simulation'),
  );
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(API_KEY) ?? '');
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(SKILL_KEY, JSON.stringify(skill));
    } catch {
      // ignore
    }
  }, [skill]);

  useEffect(() => {
    localStorage.setItem(MODE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    if (!skill[activeFile]) {
      setActiveFile('SKILL.md');
    }
  }, [skill, activeFile]);

  const selectedScenario = useMemo(
    () => SCENARIOS.find((s) => s.id === selectedId) ?? null,
    [selectedId],
  );
  const selectedResult = selectedScenario ? results.get(selectedScenario.id) ?? null : null;

  async function runOne(scenarioId: string): Promise<RunResult | null> {
    const s = SCENARIOS.find((x) => x.id === scenarioId);
    if (!s) return null;
    if (mode === 'live') {
      if (!apiKey) {
        setShowKeyDialog(true);
        return null;
      }
      try {
        return await runScenarioLive(skill, s, apiKey);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'NETWORK';
        setError(liveErrorMessage(msg));
        if (msg === 'NETWORK') setMode('simulation');
        return runScenario(skill, s);
      }
    }
    return runScenario(skill, s);
  }

  async function handleRunOne() {
    if (!selectedScenario) return;
    setIsRunning(true);
    setError(null);
    const r = await runOne(selectedScenario.id);
    if (r) {
      setResults((prev) => {
        const next = new Map(prev);
        next.set(r.scenarioId, r);
        return next;
      });
    }
    setIsRunning(false);
  }

  async function handleRunAll() {
    setIsRunning(true);
    setError(null);
    const next = new Map<string, RunResult>();
    for (const s of SCENARIOS) {
      const r = await runOne(s.id);
      if (!r) {
        // user cancelled (e.g. needed API key) — abort
        setIsRunning(false);
        return;
      }
      next.set(s.id, r);
      setResults(new Map(next));
      if (mode === 'simulation') await new Promise((res) => setTimeout(res, 80));
    }
    setIsRunning(false);
    setShowSummary(true);
  }

  function handleReset() {
    if (!confirm('לאפס את ה-Skill, התוצאות וה-API key?')) return;
    setSkill({ ...STARTER_SKILL });
    setActiveFile('SKILL.md');
    setResults(new Map());
    setShowSummary(false);
    setApiKey('');
    localStorage.removeItem(SKILL_KEY);
    localStorage.removeItem(API_KEY);
  }

  function handleFileChange(name: string, value: string) {
    setSkill((prev) => ({ ...prev, [name]: value }));
  }

  function handleAddFile(name: string) {
    setSkill((prev) => ({ ...prev, [name]: '' }));
    setActiveFile(name);
  }

  function handleDeleteFile(name: string) {
    if (name === 'SKILL.md') return;
    setSkill((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    if (activeFile === name) setActiveFile('SKILL.md');
  }

  function handleToggleMode() {
    if (mode === 'simulation') {
      if (!apiKey) {
        setShowKeyDialog(true);
        return;
      }
      setMode('live');
    } else {
      setMode('simulation');
    }
  }

  function handleSaveKey(key: string) {
    setApiKey(key);
    localStorage.setItem(API_KEY, key);
    setMode('live');
    setShowKeyDialog(false);
    setError(null);
  }

  async function handleDownload() {
    const zip = new JSZip();
    const folder = zip.folder('secret-guard');
    if (!folder) return;
    for (const [name, content] of Object.entries(skill)) {
      folder.file(name, content);
    }
    const s = computeScore(Array.from(results.values()));
    const date = new Date().toISOString().slice(0, 10);
    const readme = `# Skill generated in Skill Forge

Created on: ${date}
Score: Precision ${Math.round(s.precision * 100)}% / Recall ${Math.round(s.recall * 100)}%

## Usage

Place this folder in your Claude project's skills directory.
`;
    folder.file('README.md', readme);

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
  const score = useMemo(() => computeScore(resultsArr), [resultsArr]);
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
          <div className="flex items-center gap-3">
            {mode === 'live' && (
              <button
                onClick={() => setShowKeyDialog(true)}
                className="text-[11px] text-text-dim hover:text-text-muted transition-colors"
                title="עדכני API key"
              >
                שני API key
              </button>
            )}
            <ModeBadge mode={mode} onToggle={handleToggleMode} />
          </div>
        </header>

        {error && (
          <div className="px-5 py-2 bg-danger/10 border-b border-danger/30 text-xs text-danger flex items-center justify-between" dir="rtl">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-danger/60 hover:text-danger">×</button>
          </div>
        )}

        <main className="flex-1 min-h-0 grid grid-cols-[1.2fr_320px_1.2fr]">
          <EditorPane
            skill={skill}
            activeFile={activeFile}
            onActiveFileChange={setActiveFile}
            onFileChange={handleFileChange}
            onAddFile={handleAddFile}
            onDeleteFile={handleDeleteFile}
            onReset={handleReset}
            onDownload={handleDownload}
          />
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
            mode={mode}
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
          score={score}
          tips={tips}
          onClose={() => setShowSummary(false)}
          onDownload={handleDownload}
          onReset={handleReset}
        />
      )}

      {showKeyDialog && (
        <ApiKeyDialog
          initial={apiKey}
          onSave={handleSaveKey}
          onCancel={() => setShowKeyDialog(false)}
        />
      )}
    </>
  );
}
