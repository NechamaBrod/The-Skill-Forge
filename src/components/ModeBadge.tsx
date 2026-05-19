import type { RunMode } from '../types';

interface Props {
  mode: RunMode;
  onToggle: () => void;
}

export function ModeBadge({ mode, onToggle }: Props) {
  const isLive = mode === 'live';
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
        isLive
          ? 'bg-danger/10 border-danger/40 text-danger hover:bg-danger/20'
          : 'bg-warning/10 border-warning/40 text-warning hover:bg-warning/20'
      }`}
      title="החליפי בין Simulation ל-Live"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-danger animate-pulse' : 'bg-warning'}`} />
      {isLive ? '🔴 Live' : '🟡 Simulation'}
    </button>
  );
}
