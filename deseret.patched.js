/*
 * DeseretOne spelling patch bundle.
 *
 * This file is a generated patch overlay for deseret.js. It is intentionally
 * kept separate so the canonical source remains untouched while the project
 * can experiment with a slightly different schwa convention than Walker's PDF.
 *
 * NOTE: This project follows a small, explicit schwa convention that differs
 * from the Walker PDF in reduced-vowel and unstressed positions. The rules in
 * this patch implement that convention without changing the rest of the logic.
 */

// Usage:
//   node deseret.patched.js
//   // or copy the generated changes into deseret.js as needed.

const fs = require('fs');
let src = fs.readFileSync('deseret.js', 'utf8');

function edit(anchor, replacement, label) {
  const parts = src.split(anchor);
  if (parts.length !== 2) {
    console.error(`FAILED (${label}): expected 1 match, got ${parts.length - 1}`);
    process.exit(1);
  }
  src = parts.join(replacement);
  console.log('ok:', label);
}

edit(
  `[null, 'y', /^#/, 'ee'],`,
  `[/^[^aeiouy]+$/, 'ye', /^(s|d|ing)?#/, 'ai'],
  [/^[^aeiouy]+$/, 'y', /^#/, 'ai'],
  [null, 'y', /^#/, 'ee'],`,
  'final -y / -ye after consonants'
);

edit(
  `[null, 'ie', /^#/, 'ee'],`,
  `[/^[^aeiouy]+$/, 'ie', /^(s|d)?#/, 'ai'],
  [null, 'ie', /^#/, 'ee'],`,
  'final -ie after consonants'
);

edit(
  `[null, 'a', new RegExp('^' + C + 'e#'), 'ay'],`,
  `[/^(?!sk$|ch$|[ltm]$)[^aeiouy]+$/, 'i', /^#/, 'ai'],
  [null, 'a', new RegExp('^' + C + 'e#'), 'ay'],`,
  'final -i after consonants'
);

edit(
  `if (/[^aeiou][aeiou][bcdfklmnprstvz]$/.test(stem)) return stem + 'e';`,
  `if (/[^aeiou][aeiou][bcdfklmnprstvz]$/.test(stem)) {
    const groups = (stem.match(/[aeiouy]+/g) || []).length;
    if (groups === 1 || /(at|iz|is|ur|iv|ov|ap|ak)$/.test(stem)) return stem + 'e';
  }`,
  'restoreStem silent-e guard'
);

edit(
  `Object.assign(DESERET_MAPPINGS, DA_RESTORE_V13, DESERET_NEWS_LEXICON, DA_LEX_V14, DA_NAMES);`,
  `const DA_LEX_V15 = {
  "why": "𐐶𐐴", "hi": "𐐸𐐴", "fi": "𐑁𐐴", "sci": "𐑅𐐴", "ski": "𐑅𐐿𐐨",
  "hey": "𐐸𐐩", "obey": "𐐬𐐺𐐩", "convey": "𐐿𐐲𐑌𐑂𐐩", "survey": "𐑅𐐲𐑉𐑂𐐩",
  "prey": "𐐹𐑉𐐩", "whey": "𐐶𐐩",
  "meow": "𐑋𐐨𐐵", "avow": "𐐲𐑂𐐵",
  "alibi": "𐐰𐑊𐐲𐐺𐐴", "rabbi": "𐑉𐐰𐐺𐐴", "alumni": "𐐲𐑊𐐲𐑋𐑌𐐴",
  "fungi": "𐑁𐐲𐑌𐐾𐐴", "cacti": "𐐿𐐰𐐿𐐻𐐴",
  "butterfly": "𐐺𐐲𐐻𐐲𐑉𐑁𐑊𐐴", "firefly": "𐑁𐐴𐑉𐑁𐑊𐐴",
  "multiply": "𐑋𐐲𐑊𐐻𐐮𐐹𐑊𐐴", "imply": "𐐮𐑋𐐹𐑊𐐴", "rely": "𐑉𐐮𐑊𐐴", "defy": "𐐼𐐮𐑁𐐴",
  "naked": "𐑌𐐩𐐿𐐲𐐼", "ragged": "𐑉𐐰𐑀𐐲𐐼", "rugged": "𐑉𐐲𐑀𐐲𐐼",
  "crooked": "𐐿𐑉𐐳𐐿𐐲𐐼", "wretched": "𐑉𐐯𐐽𐐲𐐼", "beloved": "𐐺𐐮𐑊𐐲𐑂𐐲𐐼"
};
Object.assign(DESERET_MAPPINGS, DA_RESTORE_V13, DESERET_NEWS_LEXICON, DA_LEX_V14, DA_NAMES, DA_LEX_V15);`,
  'dictionary layer DA_LEX_V15'
);

console.log('deseret.patched.js generated successfully');
fs.writeFileSync('deseret.patched.js', src);
