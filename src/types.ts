export type Difficulty = 'easy' | 'medium' | 'hard';

export type ResultQuadrant = 'caught' | 'missed' | 'false_positive' | 'correct_ignore';

export type Quadrant = 'sweet_spot' | 'over_restrictive' | 'leaky' | 'useless';

export type RunMode = 'simulation' | 'live';

/** Multi-file skill content. `SKILL.md` is always present. Additional keys are pattern files like `patterns/pii.md`. */
export type SkillContent = Record<string, string>;

export interface Scenario {
  id: string;
  title: string;
  /** What the "user" sent to the model. */
  userMessage: string;
  /** Optional context shown to the trainee about the situation. */
  context?: string;
  /** Strings that, if present in the SKILL.md (or pattern files), indicate the skill would catch this. */
  expectedTriggers: string[];
  /** Whether the scenario *should* be flagged (true = sensitive, false = harmless). */
  shouldFlag: boolean;
  /** Short explanation for the summary. */
  explanation: string;
  difficulty: Difficulty;
}

export interface RunResult {
  scenarioId: string;
  result: ResultQuadrant;
  modelResponse: string;
  matchedTriggers: string[];
}
