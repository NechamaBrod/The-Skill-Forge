import { useState } from 'react';
import Editor from '@monaco-editor/react';
import type { SkillContent } from '../types';

interface Props {
  skill: SkillContent;
  activeFile: string;
  onActiveFileChange: (name: string) => void;
  onFileChange: (name: string, value: string) => void;
  onAddFile: (name: string) => void;
  onDeleteFile: (name: string) => void;
  onReset: () => void;
  onDownload: () => void;
}

export function EditorPane({
  skill,
  activeFile,
  onActiveFileChange,
  onFileChange,
  onAddFile,
  onDeleteFile,
  onReset,
  onDownload,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('patterns/');
  const fileNames = Object.keys(skill);

  function commitAdd() {
    const trimmed = newName.trim();
    if (!trimmed || skill[trimmed] !== undefined) {
      setAdding(false);
      setNewName('patterns/');
      return;
    }
    onAddFile(trimmed);
    setAdding(false);
    setNewName('patterns/');
  }

  return (
    <div className="flex flex-col h-full border-l border-border bg-bg-panel">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-elevated">
        <div className="flex items-center gap-2" dir="rtl">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-sm font-medium">העורך</span>
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

      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border bg-bg overflow-x-auto code-ltr">
        {fileNames.map((name) => {
          const isActive = name === activeFile;
          const isMain = name === 'SKILL.md';
          return (
            <div
              key={name}
              className={`group flex items-center gap-1 px-2 py-1 rounded-md text-xs cursor-pointer whitespace-nowrap ${
                isActive ? 'bg-bg-elevated text-text' : 'text-text-dim hover:text-text-muted'
              }`}
              onClick={() => onActiveFileChange(name)}
            >
              <span className="font-mono">{name}</span>
              {!isMain && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`למחוק את ${name}?`)) onDeleteFile(name);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-text-dim hover:text-danger transition-opacity"
                  aria-label="מחקי קובץ"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
        {adding ? (
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={commitAdd}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitAdd();
              if (e.key === 'Escape') {
                setAdding(false);
                setNewName('patterns/');
              }
            }}
            className="text-xs font-mono px-2 py-1 rounded-md bg-bg-elevated border border-accent outline-none w-40"
            placeholder="patterns/pii.md"
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="text-xs px-2 py-1 rounded-md text-text-dim hover:text-accent hover:bg-bg-elevated transition-colors"
            title="הוספת קובץ"
          >
            + קובץ
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="markdown"
          path={activeFile}
          value={skill[activeFile] ?? ''}
          onChange={(v) => onFileChange(activeFile, v ?? '')}
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
