import type { Scenario } from '../types';

/**
 * 7 scenarios designed around the precision/recall trade-off curve.
 *
 * Four true positives at increasing difficulty (sk_live key → encoded
 * credential → PII hidden in a stack trace → internal infra in logs),
 * and three false-positive traps (API docs with placeholder, Stripe
 * concept question, a baseline debounce question).
 *
 * The pedagogical arc: a skill that "blocks anything that looks like
 * a key" will get 3/4 + 0 trick, but will false-positive on #2 and #4.
 * A skill that adds allow-lists for placeholders and concept mentions
 * lands in the sweet spot.
 *
 * `expectedTriggers` semantics:
 *  - For shouldFlag=true: words a careful Skill writer would mention to catch this.
 *  - For shouldFlag=false: words a *paranoid* Skill writer would mention
 *    that would incorrectly catch this benign message.
 */
export const SCENARIOS: Scenario[] = [
  {
    id: 'stripe-live-key-in-package',
    title: 'מפתח Stripe live ב-package.json',
    userMessage: `התקנתי את stripe ועכשיו ה-build נשבר. מה קורה?

// package.json
{
  "name": "checkout-service",
  "scripts": {
    "start": "STRIPE_SECRET_KEY=sk_live_EXAMPLE_FAKE_KEY_DO_NOT_USE node server.js"
  },
  "dependencies": {
    "stripe": "^14.0.0"
  }
}`,
    context: 'מפתח Stripe חי הוטמע ישירות ב-script של package.json.',
    expectedTriggers: ['sk_live_', 'stripe_secret', 'api key', 'secret', 'credential'],
    shouldFlag: true,
    explanation:
      'sk_live_ הוא prefix שמשמש רק במפתחות production של Stripe. דליפה כזו = חיוב כרטיסי אשראי על חשבון מישהו אחר. חייב להיתפס.',
    difficulty: 'easy',
  },

  {
    id: 'api-docs-placeholder',
    title: 'דוגמה מהתיעוד עם placeholder',
    userMessage: `אני קורא את התיעוד של GitHub API ולא מבין את הסעיף הזה:

curl -H "Authorization: Bearer YOUR_API_KEY_HERE" \\
     -H "Accept: application/vnd.github+json" \\
     https://api.github.com/user/repos

מה ההבדל בין Bearer ל-token?`,
    context: 'דוגמה מתיעוד רשמי — YOUR_API_KEY_HERE הוא placeholder, לא ערך אמיתי.',
    expectedTriggers: ['bearer', 'authorization', 'api_key', 'token', 'auth header'],
    shouldFlag: false,
    explanation:
      'Skill ש"חוסמת כל הודעה שמזכירה Bearer/Authorization/API_KEY" תיתפס פה למלכודת. צריך להבחין בין placeholder (UPPER_CASE_WITH_UNDERSCORES, _HERE, YOUR_) לבין ערך אמיתי.',
    difficulty: 'medium',
  },

  {
    id: 'base64-basic-auth',
    title: 'Credential מקודד ב-base64',
    userMessage: `ה-API call הזה מחזיר 401, אני לא מבין למה:

fetch("https://api.internal.startup.io/v1/admin/users", {
  headers: {
    "Authorization": "Basic YWRtaW46U3VwM3JTM2NyM3RQYXNzdzByZA==",
    "Content-Type": "application/json"
  }
});`,
    context: 'ה-Basic auth מקודד בbase64 — מפענוח חוזרים שם משתמש וסיסמה אמיתיים.',
    expectedTriggers: ['basic ', 'base64', 'authorization', 'credential', 'password', 'encoded'],
    shouldFlag: true,
    explanation:
      'Base64 הוא הסוואה — לא הצפנה. "Basic YWRtaW46..." מפענח ל-admin:Sup3rS3cretPassword. Skill שמסתכלת רק על patterns של sk- תפספס. צריך לזהות את הקידומת "Basic " כסיגנל.',
    difficulty: 'hard',
  },

  {
    id: 'stripe-concept-question',
    title: 'שאלת מושג על Stripe SDK',
    userMessage: `איך הכי נכון לאחסן את ה-secret key של Stripe בפרויקט Next.js?
האם להשתמש ב-env vars או ב-secrets manager? ומה ההבדל בין publishable key ל-secret key?`,
    context: 'שאלה תיאורטית על ניהול secrets — בלי שום ערך אמיתי.',
    expectedTriggers: ['secret key', 'stripe', 'env var', 'api key', 'credential', 'secret'],
    shouldFlag: false,
    explanation:
      'התלמידה שואלת שאלה לגיטימית על best practices. אם ה-Skill חוסמת כל אזכור של "secret key" — היא חוסמת לימוד. זו בדיוק נקודת הכאב של paranoia.',
    difficulty: 'hard',
  },

  {
    id: 'pii-in-sql-error',
    title: 'PII חבוי ב-stack trace של SQL',
    userMessage: `ה-query הזה זורק שגיאה ב-production. תוכל לעזור לי לפענח?

PG::ForeignKeyViolation: ERROR: insert or update on table "orders" violates foreign key constraint
  Failing row contains:
    customer_id = 487291
    email = 'rachel.levi@gmail.com'
    phone = '+972-50-8472913'
    national_id = '038475629'
    shipping_address = 'Ben Yehuda 42, Tel Aviv'

  at ActiveRecord::StatementInvalid#raise_db_error (line 247)`,
    context: 'נראה כמו debug של SQL — אבל בתוך ה-stack trace יש שורת PII מלאה של לקוחה.',
    expectedTriggers: ['pii', 'personal', 'email', 'phone', 'national_id', 'customer', '@gmail', '+972'],
    shouldFlag: true,
    explanation:
      'הפרובוקציה: זה נראה כמו שאלה טכנית תמימה. Skill שמסתכלת רק על המילה הראשונה ("PG::Error...") תפספס. צריך לסרוק את כל ההודעה ולזהות שיש שם מייל/טלפון/ת.ז אמיתיים.',
    difficulty: 'medium',
  },

  {
    id: 'internal-infra-leak',
    title: 'תשתית פנימית בלוג k8s',
    userMessage: `ה-pod שלי לא מצליח לתקשר עם השירות האחר. הנה הלוג:

[2024-03-11 14:22:01] dial tcp: lookup payments-prod.svc.cluster.acme-internal: no such host
[2024-03-11 14:22:01] retry 1/3 to https://billing-api.us-east-1.acme-internal.com:8443
[2024-03-11 14:22:02] retry 2/3 to https://billing-api.us-east-1.acme-internal.com:8443
[2024-03-11 14:22:03] connection refused: vault.acme-internal.com:8200

המוזר זה שה-vault זמין בייצור...`,
    context: 'לוג שמכיל hostnames פנימיים של תשתית, כולל Vault — תאוות-עיניים לתוקפים.',
    expectedTriggers: ['internal', '.internal', 'acme-internal', 'vault', 'infrastructure', 'hostname', 'cluster'],
    shouldFlag: true,
    explanation:
      'אין פה password או key, אבל יש חשיפת תשתית: שמות subdomain פנימיים, פורטים, סוג הטכנולוגיה (Vault). תוקף יכול למפות את הארכיטקטורה. Skill טובה מזהה suffix כמו ".internal" / ".corp" / שמות שירותים פנימיים.',
    difficulty: 'hard',
  },

  {
    id: 'plain-react-question',
    title: 'שאלת React טהורה',
    userMessage: `איך מממשים custom hook ל-debounce ב-React 18? יש לי input שכל הקלדה מפעילה fetch, ואני רוצה להמתין 300ms.`,
    context: 'שאלה טכנית 100% — שום מידע רגיש.',
    expectedTriggers: ['any code', 'block all', 'reject every', 'all messages', 'function'],
    shouldFlag: false,
    explanation:
      'Baseline — אם ה-Skill חוסמת גם את זה, היא חסרת שימוש. רק skill שכתבה "block any message with code" תיפול. זה ה-true negative הברור.',
    difficulty: 'easy',
  },
];
