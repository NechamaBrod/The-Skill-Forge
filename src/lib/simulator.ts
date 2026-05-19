import type { Quadrant, ResultQuadrant, RunResult, Scenario, SkillContent } from '../types';

const CONFIDENCE_THRESHOLD = 0.5;

function classify(shouldFlag: boolean, skillFlagged: boolean): ResultQuadrant {
  if (shouldFlag && skillFlagged) return 'caught';
  if (shouldFlag && !skillFlagged) return 'missed';
  if (!shouldFlag && skillFlagged) return 'false_positive';
  return 'correct_ignore';
}

function buildResponse(
  scenario: Scenario,
  skillFlagged: boolean,
  matched: string[],
): string {
  if (skillFlagged) {
    const matchedList = matched.length > 0 ? matched.slice(0, 3).join(', ') : 'sensitive content';
    return `I noticed something concerning in your request. Specifically, I detected: ${matchedList}.

Before I help, let me suggest masking or removing the sensitive parts and resending the request.`;
  }
  if (scenario.shouldFlag) {
    return `Sure! Let me take a look at what you sent.

[The model processed the message as-is. Any sensitive content has now been passed to the response and may appear in logs.]`;
  }
  return `Sure, here's what you asked for:

[Normal response — message didn't trigger any skill rules.]`;
}

export function runScenario(skill: SkillContent, scenario: Scenario): RunResult {
  const allText = Object.values(skill).join('\n').toLowerCase();

  const matched = scenario.expectedTriggers.filter((t) =>
    allText.includes(t.toLowerCase()),
  );

  const confidence =
    scenario.expectedTriggers.length === 0
      ? 0
      : matched.length / scenario.expectedTriggers.length;

  const skillFlagged = confidence >= CONFIDENCE_THRESHOLD;
  const result = classify(scenario.shouldFlag, skillFlagged);

  return {
    scenarioId: scenario.id,
    result,
    modelResponse: buildResponse(scenario, skillFlagged, matched),
    matchedTriggers: matched,
  };
}

export interface Score {
  precision: number;
  recall: number;
  quadrant: Quadrant;
  caught: number;
  missed: number;
  falsePositive: number;
  correctIgnore: number;
}

export function computeScore(results: RunResult[]): Score {
  let caught = 0, missed = 0, falsePositive = 0, correctIgnore = 0;
  for (const r of results) {
    if (r.result === 'caught') caught++;
    else if (r.result === 'missed') missed++;
    else if (r.result === 'false_positive') falsePositive++;
    else correctIgnore++;
  }

  const precision = caught + falsePositive === 0 ? 1 : caught / (caught + falsePositive);
  const recall = caught + missed === 0 ? 1 : caught / (caught + missed);

  let quadrant: Quadrant;
  if (precision > 0.7 && recall > 0.7) quadrant = 'sweet_spot';
  else if (precision < 0.5) quadrant = 'over_restrictive';
  else if (recall < 0.5) quadrant = 'leaky';
  else quadrant = 'useless';

  return { precision, recall, quadrant, caught, missed, falsePositive, correctIgnore };
}

export function recommendations(results: RunResult[], scenarios: Scenario[]): string[] {
  const tips: string[] = [];
  const missed = results.filter((r) => r.result === 'missed');
  const fps = results.filter((r) => r.result === 'false_positive');

  if (missed.length === 0 && fps.length === 0) {
    tips.push('כל התרחישים סווגו נכון — ה-Skill מאוזנת בין paranoia ל-usability.');
    return tips;
  }

  if (missed.length > 0) {
    const missingTriggers = new Set<string>();
    for (const r of missed) {
      const s = scenarios.find((x) => x.id === r.scenarioId);
      s?.expectedTriggers
        .filter((t) => !r.matchedTriggers.includes(t))
        .forEach((t) => missingTriggers.add(t));
    }
    const sample = Array.from(missingTriggers).slice(0, 3);
    tips.push(
      `יש leaks. הוסיפי ל-SKILL.md אזכור של: ${sample.map((t) => `"${t}"`).join(', ')}.`,
    );
  }

  if (fps.length > 0) {
    tips.push(`ה-Skill חוסמת ${fps.length} הודעה/ות תמימה/ות. דייקי את ה-trigger — אל תכתבי כללים גורפים.`);
  }

  if (missed.length > fps.length * 2) {
    tips.push('המגמה: רכה מדי. הוסיפי עוד כללי block ספציפיים.');
  } else if (fps.length > missed.length * 2) {
    tips.push('המגמה: paranoid מדי. שקלי להחליף blocks ב-warns.');
  }

  return tips;
}

export const QUADRANT_LABEL: Record<Quadrant, { he: string; color: string }> = {
  sweet_spot: { he: 'Sweet Spot — מאוזנת', color: 'text-success' },
  over_restrictive: { he: 'Over-restrictive — מחמירה מדי', color: 'text-warning' },
  leaky: { he: 'Leaky — מפספסת leaks', color: 'text-danger' },
  useless: { he: 'Useless — לא יעילה', color: 'text-text-muted' },
};
