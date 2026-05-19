import type { Scenario } from '../types';

/**
 * Placeholder scenarios — replace with real course content.
 *
 * `expectedTriggers` are case-insensitive substrings; if the user's SKILL.md
 * (or any pattern file) mentions enough of them, the simulator considers
 * the skill to have "flagged" the scenario. The threshold is matched/total >= 0.5.
 *
 * For harmless scenarios (`shouldFlag: false`), supply triggers that the
 * skill would *only* mention if it's being over-paranoid — e.g. words that
 * a casual paranoid writer would include but a precise one wouldn't.
 */
export const SCENARIOS: Scenario[] = [
  {
    id: 'api-key-paste',
    title: 'משתמשת מדביקה API key',
    userMessage: `Hey, can you debug this for me?

const client = new OpenAI({ apiKey: "sk-proj-A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0" });`,
    context: 'המשתמשת הדביקה קוד עם API key חי.',
    expectedTriggers: ['api key', 'sk-', 'secret', 'apikey'],
    shouldFlag: true,
    explanation: 'מפתח API חי. Skill טובה תזהה תבנית sk- או "api key".',
    difficulty: 'easy',
  },
  {
    id: 'env-file',
    title: 'דליפת .env',
    userMessage: `מה דעתך על ה-config שלי?

DATABASE_URL=postgres://admin:Sup3rS3cret@db.prod.internal:5432/users
STRIPE_SECRET_KEY=sk_live_51HxYzABCdef123456
JWT_SECRET=my-jwt-signing-key`,
    context: 'תוכן קובץ .env מודבק.',
    expectedTriggers: ['.env', 'database_url', 'secret', 'password', 'credential'],
    shouldFlag: true,
    explanation: 'קובץ .env שלם עם credentials של production. סיכון גבוה.',
    difficulty: 'easy',
  },
  {
    id: 'pii-customer',
    title: 'PII של לקוח',
    userMessage: `הלקוח Sarah Cohen (ת.ז 304857291, sarah.cohen@gmail.com, 050-1234567)
מתלונן שלא מצליח להתחבר. תוכל לעזור לי לנסח תשובה?`,
    context: 'פרטים מזהים של לקוח אמיתי.',
    expectedTriggers: ['pii', 'personal', 'ת.ז', 'email', 'phone'],
    shouldFlag: true,
    explanation: 'PII של לקוח. צריך זיהוי ובקשת אנונימיזציה.',
    difficulty: 'medium',
  },
  {
    id: 'harmless-question',
    title: 'שאלה תמימה',
    userMessage: 'איך מממשים debounce ב-React hook?',
    context: 'שאלה כללית, בלי שום מידע רגיש.',
    expectedTriggers: ['block everything', 'reject all', 'any code'],
    shouldFlag: false,
    explanation: 'תוכן ניטרלי. Skill תיתפס כ-false_positive רק אם paranoid מאוד.',
    difficulty: 'easy',
  },
  {
    id: 'internal-url',
    title: 'URL פנימי + JWT',
    userMessage: `הקריאה הזו נכשלת:

fetch("https://internal.acme-corp.com/api/v2/users?auth_token=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiYWRtaW4ifQ.abc123")`,
    context: 'JWT בתוך URL פנימי.',
    expectedTriggers: ['token', 'jwt', 'auth_token', 'eyj', 'internal'],
    shouldFlag: true,
    explanation: 'JWT ו-domain פנימי. הטוקן עלול להיות בתוקף.',
    difficulty: 'medium',
  },
  {
    id: 'code-mentions-secret',
    title: 'קוד שמדבר על secrets',
    userMessage: `איך בודקים אם משתנה סביבה process.env.API_KEY הוגדר נכון בלי לחשוף את הערך?`,
    context: 'אזכור של API_KEY כשם משתנה, בלי ערך אמיתי.',
    expectedTriggers: ['block any mention', 'reject keywords', 'ban word'],
    shouldFlag: false,
    explanation: 'רק אזכור שם — לא ערך. Skill שתחסום פה היא paranoid.',
    difficulty: 'hard',
  },
  {
    id: 'aws-keys',
    title: 'AWS credentials',
    userMessage: `ה-deploy שלי לא עובד, זה ה-config:

AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`,
    context: 'AWS access key + secret מודבקים.',
    expectedTriggers: ['aws', 'akia', 'access key', 'secret'],
    shouldFlag: true,
    explanation: 'AKIA-prefix = חתימה ברורה של AWS access key.',
    difficulty: 'easy',
  },
];
