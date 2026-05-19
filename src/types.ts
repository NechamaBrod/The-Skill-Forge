export type ExpectedBehavior = 'block' | 'allow' | 'warn';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Verdict = 'caught' | 'leaked' | 'over-blocked' | 'correct-ignore';
export type RunStatus = 'idle' | 'caught' | 'leaked' | 'over-blocked' | 'correct-ignore';

export interface Scenario {
  id: string;
  title: string;
  userMessage: string;
  context?: string;
  expectedBehavior: ExpectedBehavior;
  /** Strings/regex tokens that, if present in user message, represent sensitive content the Skill should catch. */
  sensitiveTokens: string[];
  /** Tags that describe the *category* of risk. E.g. 'api-key', 'pii', 'credentials'. */
  riskTags: string[];
  /** Plain-language explanation for the summary. */
  explanation: string;
  difficulty: Difficulty;
}

export interface RunResult {
  scenarioId: string;
  verdict: Verdict;
  modelResponse: string;
  rationale: string;
}
