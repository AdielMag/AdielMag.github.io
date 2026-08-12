/* ===========================================================================
   Prose tic counter. Run before publishing:

       node tools/audit-prose.mjs             # whole corpus
       node tools/audit-prose.mjs <slug>      # one post

   The corpus was audited for AI-writing tells in August 2026. Vocabulary came
   back clean; what read as generated was a handful of repeated rhetorical
   moves. This counts the ones that are countable, so "it feels fine" isn't the
   only check. See .claude/skills/blog-post/SKILL.md for what each budget means
   and why.

   Nothing here fails a build. It prints numbers and flags the ones outside
   their budget with a "!".
   =========================================================================== */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'content/articles');

const arg = process.argv[2];
const files = readdirSync(dir)
  .filter((f) => f.endsWith('.md'))
  .filter((f) => !arg || f === `${arg}.md` || f === arg);

if (!files.length) {
  console.error(arg ? `No article matching "${arg}"` : 'No articles found');
  process.exit(1);
}

// Budgets, in the same order as the printed columns.
const budget = {
  words: [700, 1200],
  emDash: [0, 0],
  dashPer100: [0, 1.2],   // spaced " - " per 100 words
  bold: [0, 9],
  shortPct: [8, 30],      // sentences of six words or fewer
  meanLen: [13, 20],
  negParallel: [0, 1],    // "X isn't A, it's B"
  inlineHeader: [0, 1],   // "- **Thing.** ..."
  heresThe: [0, 0],
};

function measure(src) {
  const noFence = src.replace(/```[\s\S]*?```/g, '');
  let prose = noFence
    .replace(/^!\[.*$/gm, '')
    .replace(/^\[demo:[a-z]+\]$/gm, '')
    .replace(/^\*More .*$/gm, '')
    .replace(/^#.*$/gm, '');

  // Word count is over the whole post (headings and captions included, code
  // fences excluded) so it matches the 700-1200 target in the skill. The
  // per-100-word rates below use the same number.
  const words = noFence.split(/\s+/).filter(Boolean).length;
  const sentences = prose
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const lengths = sentences.map((s) => s.split(/\s+/).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / Math.max(1, lengths.length);
  const short = lengths.filter((n) => n <= 6).length;
  const dashes = (prose.match(/\S - \S/g) || []).length;

  return {
    words,
    emDash: (noFence.match(/—/g) || []).length,
    dashPer100: words ? (dashes * 100) / words : 0,
    bold: (prose.match(/\*\*[^*]+\*\*/g) || []).length,
    shortPct: (short * 100) / Math.max(1, lengths.length),
    meanLen: mean,
    negParallel: (prose.match(/isn't [^.,;]{0,40}[,;] it's|is not [^.,;]{0,40}[,;] it's|not [^.,;]{0,30}, but/gi) || []).length,
    inlineHeader: (prose.match(/^\s*[-*]\s+\*\*/gm) || []).length,
    heresThe: (prose.match(/\bHere'?s the\b/g) || []).length,
  };
}

const cols = Object.keys(budget);
const width = { words: 6, emDash: 7, dashPer100: 7, bold: 5, shortPct: 7, meanLen: 6, negParallel: 4, inlineHeader: 4, heresThe: 6 };
const label = { dashPer100: 'dash/c', shortPct: 'short%', meanLen: 'mean', negParallel: 'neg', inlineHeader: 'hdr', heresThe: "here's" };

let flagged = 0;
console.log('%s %s', 'file'.padEnd(32), cols.map((c) => (label[c] || c).padStart(width[c])).join(' '));
console.log('-'.repeat(32 + cols.reduce((a, c) => a + width[c] + 1, 0)));

for (const f of files) {
  const m = measure(readFileSync(join(dir, f), 'utf8'));
  const cells = cols.map((c) => {
    const [lo, hi] = budget[c];
    const v = m[c];
    const bad = v < lo || v > hi;
    if (bad) flagged++;
    const shown = Number.isInteger(v) ? String(v) : v.toFixed(1);
    return (bad ? `!${shown}` : shown).padStart(width[c]);
  });
  console.log('%s %s', f.replace(/\.md$/, '').padEnd(32), cells.join(' '));
}

console.log('-'.repeat(32 + cols.reduce((a, c) => a + width[c] + 1, 0)));
console.log(
  flagged
    ? `${flagged} value(s) outside budget, marked "!". Budgets are in tools/audit-prose.mjs.`
    : 'Everything inside budget.'
);
