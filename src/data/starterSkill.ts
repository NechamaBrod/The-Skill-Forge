import type { SkillContent } from '../types';

export const STARTER_SKILL: SkillContent = {
  'SKILL.md': `---
name: secret-guard
description: Detects and blocks sensitive data before it reaches the model.
---

# Secret Guard

<!-- כתבי כאן את הכללים שלך. -->
<!-- חשבי: איזה דברים את חוסמת? איזה דברים את מאפשרת? -->
<!-- זכרי — paranoid מדי = תכבו אותך. רך מדי = leaks. -->

## When to use this skill

When the user sends a message that contains...

## Block

- ...

## Warn

- ...

## Allow

- ...
`,
};
