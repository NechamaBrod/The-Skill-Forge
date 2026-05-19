import type { RunResult, Scenario, Verdict } from '../types';

/**
 * Generic "concept" keywords that map to a risk category.
 * If the SKILL.md mentions any of these, we treat it as "the skill covers
 * this risk category" — even if the user didn't list the exact token.
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'api-key': ['api key', 'api_key', 'apikey', 'api-key', 'sk-', 'openai', 'anthropic', 'secret key'],
  credentials: ['credential', 'password', 'secret', 'token', 'auth'],
  secret: ['secret', 'key', 'password', 'credential'],
  env: ['.env', 'env file', 'environment variable', 'dotenv'],
  database: ['database', 'db_', 'postgres', 'mysql', 'connection string'],
  pii: ['pii', 'personal', 'identity', 'ת.ז', 'תז', 'email', 'phone', 'אימייל', 'טלפון'],
  'personal-data': ['pii', 'personal', 'gdpr', 'privacy', 'customer data'],
  customer: ['customer', 'לקוח', 'user data'],
  token: ['token', 'jwt', 'bearer', 'session'],
  jwt: ['jwt', 'eyj', 'json web token'],
  'internal-url': ['internal', '.internal', 'corp.com', 'intranet', 'private url'],
  aws: ['aws', 'akia', 'amazon'],
};

function normalize(s: string): string {
  return s.toLowerCase();
}

/** Does the skill text mention this risk category, in any form? */
function skillCoversRisk(skill: string, scenario: Scenario): boolean {
  const text = normalize(skill);
  // Direct token match
  for (const tok of scenario.sensitiveTokens) {
    if (tok && text.includes(normalize(tok))) return true;
  }
  // Category match via riskTags
  for (const tag of scenario.riskTags) {
    const keywords = CATEGORY_KEYWORDS[tag] ?? [tag];
    for (const kw of keywords) {
      if (text.includes(normalize(kw))) return true;
    }
  }
  return false;
}

/** How strict is the user's skill, on a 0-3 scale, based on coarse signals. */
function skillStrictness(skill: string): number {
  const t = normalize(skill);
  let score = 0;
  if (/\bblock\b/.test(t) || /חסו[םמ]/.test(t)) score += 1;
  if (/\brefuse\b|\breject\b|\bdo not\b|\bnever\b|\bdeny\b/.test(t)) score += 1;
  if (/anything|every|all .* (input|message|data)/.test(t)) score += 1;
  if (/paranoid|maximum|strict/.test(t)) score += 1;
  return score;
}

function verdictToResponse(verdict: Verdict, scenario: Scenario): string {
  switch (verdict) {
    case 'caught':
      return `🛡  Skill triggered.\nBlocked the request — detected ${describeMatch(scenario)}.\nAsked the user to redact and resubmit.`;
    case 'leaked':
      return `⚠  The model processed the message as-is.\nSensitive content (${describeMatch(scenario)}) was passed through to the response and may now appear in logs / prompt cache / training data.`;
    case 'over-blocked':
      return `🚫 Skill triggered (incorrectly).\nThe message was blocked even though it didn't contain sensitive data.\nThe user is now annoyed and will probably disable your skill.`;
    case 'correct-ignore':
      return `✓ Skill stayed quiet.\nMessage didn't match any rules — passed through to the model as a normal request.`;
  }
}

function describeMatch(scenario: Scenario): string {
  if (scenario.riskTags.length === 0) return 'sensitive content';
  return scenario.riskTags.slice(0, 2).join(' / ');
}

function rationaleFor(verdict: Verdict, scenario: Scenario, covered: boolean): string {
  switch (verdict) {
    case 'caught':
      return `ה-SKILL.md שלך מזכירה את ${describeMatch(scenario)} — לכן זוהתה התבנית.`;
    case 'leaked':
      return covered
        ? `ה-Skill מזכירה את הקטגוריה אבל בלי כלל חסימה ברור. הוסיפי "Block" עם המילים הרלוונטיות.`
        : `ה-Skill לא מתייחסת ל-${describeMatch(scenario)} בכלל. הוסיפי כלל.`;
    case 'over-blocked':
      return `ה-Skill שלך מחמירה מדי — חסמה הודעה תמימה. דייקי את ה-trigger.`;
    case 'correct-ignore':
      return `אין פה תוכן רגיש, וה-Skill נכון לא הופעלה.`;
  }
}

export function runScenario(skill: string, scenario: Scenario): RunResult {
  const covered = skillCoversRisk(skill, scenario);
  const strictness = skillStrictness(skill);
  const isSensitive = scenario.expectedBehavior !== 'allow';

  let willBlock = false;
  if (isSensitive) {
    // Block if the skill covers this risk AND has any blocking language.
    willBlock = covered && strictness >= 1;
  } else {
    // For harmless scenarios — only over-block if user is *very* paranoid
    // and happened to mention a keyword that appears in the harmless message.
    const text = normalize(scenario.userMessage);
    const skillT = normalize(skill);
    const overlap = ['key', 'api', 'env', 'secret', 'password', 'token'].some(
      (kw) => skillT.includes(kw) && text.includes(kw),
    );
    willBlock = overlap && strictness >= 2;
  }

  let verdict: Verdict;
  if (isSensitive && willBlock) verdict = 'caught';
  else if (isSensitive && !willBlock) verdict = 'leaked';
  else if (!isSensitive && willBlock) verdict = 'over-blocked';
  else verdict = 'correct-ignore';

  return {
    scenarioId: scenario.id,
    verdict,
    modelResponse: verdictToResponse(verdict, scenario),
    rationale: rationaleFor(verdict, scenario, covered),
  };
}

export interface Metrics {
  precision: number;
  recall: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  trueNegatives: number;
}

export function computeMetrics(results: RunResult[]): Metrics {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (const r of results) {
    switch (r.verdict) {
      case 'caught': tp++; break;
      case 'leaked': fn++; break;
      case 'over-blocked': fp++; break;
      case 'correct-ignore': tn++; break;
    }
  }
  const precision = tp + fp === 0 ? 1 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 1 : tp / (tp + fn);
  return { precision, recall, truePositives: tp, falsePositives: fp, falseNegatives: fn, trueNegatives: tn };
}

export function recommendations(results: RunResult[], scenarios: Scenario[]): string[] {
  const tips: string[] = [];
  const leaked = results.filter((r) => r.verdict === 'leaked');
  const over = results.filter((r) => r.verdict === 'over-blocked');

  if (leaked.length === 0 && over.length === 0) {
    tips.push('כל התרחישים סווגו נכון — ה-Skill מאוזנת בין paranoia ל-usability.');
    return tips;
  }

  if (leaked.length > 0) {
    const tagCounts = new Map<string, number>();
    for (const r of leaked) {
      const s = scenarios.find((x) => x.id === r.scenarioId);
      s?.riskTags.forEach((t) => tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1));
    }
    const topTag = [...tagCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    if (topTag) tips.push(`את מפספסת בעיקר ${topTag}. הוסיפי כלל ב-SKILL.md שמזכיר את הקטגוריה הזו במפורש.`);
    else tips.push(`יש leaks — הוסיפי סעיף "Block" עם מילים מפורשות כמו secret / token / password.`);
  }

  if (over.length > 0) {
    tips.push(`ה-Skill חוסמת ${over.length} הודעה/ות תמימה/ות. דייקי את ה-trigger — אל תפעילי על אזכור גנרי של "key" או "api".`);
  }

  if (leaked.length > over.length * 2) {
    tips.push('המגמה: רכה מדי. כדאי להוסיף עוד כללי block.');
  } else if (over.length > leaked.length * 2) {
    tips.push('המגמה: paranoid מדי. שקלי להחליף blocks ב-warns.');
  }

  return tips;
}
