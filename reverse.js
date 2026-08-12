/* reverse.js — Deseret back into English.
 *
 * The dictionary is English -> Deseret, so reversing it is many-to-one:
 * about 92% of Deseret forms have exactly one English source, and the rest
 * are homophones (𐐻𐐭 is both "to" and "two"). Candidates are therefore
 * ranked rather than guessed at, and the alternatives kept for display.
 */
(function (root) {
  'use strict';

  /* Ordered by rough frequency. A homophone that appears here wins, which
     is what settles to/two, there/their and know/no in ordinary text. */
  const COMMON = ['the','be','to','of','and','a','in','that','have','i','it','for','not','on','with',
    'he','as','you','do','at','this','but','his','by','from','they','we','say','her','she','or','an',
    'will','my','one','all','would','there','their','what','so','up','out','if','about','who','get',
    'which','go','me','when','make','can','like','time','no','just','him','know','take','people',
    'into','year','your','good','some','could','them','see','other','than','then','now','look','only',
    'come','its','over','think','also','back','after','use','two','how','our','work','first','well',
    'way','even','new','want','because','any','these','give','day','most','us','is','are','was','were',
    'been','has','had','said','more','very','here','through','where','much','before','right','too',
    'read','week','sun','son','buy','hear','four','made','peace','red','wood',
    // Second tier: the commoner half of each frequent homophone pair.
    'news','would','know','one','see','their','way','need','hour','wear','write','meet','great',
    'whole','mail','pair','road','role','scene','some','steal','tail','through','wait','weather',
    'which','wine','your','sale','plane','break','cell','fair','flower','heal','hole','male',
    'poor','principle','roll','seen','sum','stare','steel','tale','threw','tide','waste','weight',
    'whether','witch','plain','brake','sell','fare','flour','grate','heel','pear','pour',
    'principal','rode','sail','stair','sun','weak','wood','won','knew','maid','piece','bee','sea',
    'by','here','for','no','be','to'];
  /* A word may appear twice in the list above; the earlier position is the
     intended one, so later duplicates must not overwrite it. */
  const RANK = new Map();
  COMMON.forEach((w, i) => { if (!RANK.has(w)) RANK.set(w, i); });

  let index = null;
  let indexKey = '';

  /* The raw dictionary value is not what the user sees: dialect and the
     spelling options rewrite it afterwards (𐐶𐐫𐑌𐐻 becomes 𐐶𐐪𐑌𐐻 in one
     dialect). Indexing the raw values would therefore miss most input, so
     each entry is rendered through the same path the page translator uses.
     ~20k words costs roughly 150ms, done once per settings combination. */
  function build(dialect, opts) {
    const key = dialect + '|' + JSON.stringify(opts || {});
    if (index && indexKey === key) return index;
    index = new Map();
    indexKey = key;
    const map = root.DESERET_MAPPINGS;
    if (!map) return index;
    const render = root.translateWordWithDialect;
    for (const en in map) {
      let de;
      if (render) {
        try { de = render(en, dialect, opts); } catch (e) { de = map[en]; }
      } else {
        de = map[en];
      }
      if (!de) continue;
      const bucket = index.get(de);
      if (bucket) { if (bucket.indexOf(en) === -1) bucket.push(en); } else index.set(de, [en]);
    }
    for (const [, list] of index) {
      if (list.length > 1) list.sort(score);
    }
    return index;
  }

  /* Prefer a common word; then a plain form over an odd derived one; then
     the shorter; then alphabetical, so the result is at least stable. */
  function score(a, b) {
    const ra = RANK.has(a) ? RANK.get(a) : Infinity;
    const rb = RANK.has(b) ? RANK.get(b) : Infinity;
    if (ra !== rb) return ra - rb;
    /* The inflection generator emits forms that are not English: "agencys"
       beside the real "agencies". Prefer the genuine spelling. */
    const junk = (w) => (/[^aeiou]ys$/.test(w) ? 2 : 0) + (/[^aeiou]yed$/.test(w) ? 2 : 0);
    const ja = junk(a), jb = junk(b);
    if (ja !== jb) return ja - jb;
    const real = (w) => (/ies$/.test(w) || /ied$/.test(w) ? -1 : 0);
    const ma = real(a), mb = real(b);
    if (ma !== mb) return ma - mb;
    const da = /(?:ed|ing|s|es)$/.test(a) ? 1 : 0;
    const db = /(?:ed|ing|s|es)$/.test(b) ? 1 : 0;
    if (da !== db) return da - db;
    if (a.length !== b.length) return a.length - b.length;
    return a < b ? -1 : 1;
  }

  const DESERET_CHAR = /[\u{10400}-\u{1044F}]/u;
  const isUpper = (cp) => cp >= 0x10400 && cp <= 0x10427;
  const lower = (s) => Array.from(s).map((ch) => {
    const cp = ch.codePointAt(0);
    return isUpper(cp) ? String.fromCodePoint(cp + 40) : ch;
  }).join('');

  function matchCase(sample, word) {
    const first = sample.codePointAt(0);
    if (!isUpper(first)) return word;
    const allCaps = Array.from(sample).every((ch) => {
      const cp = ch.codePointAt(0);
      return !DESERET_CHAR.test(ch) || isUpper(cp);
    });
    if (allCaps && Array.from(sample).length > 1) return word.toUpperCase();
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  /* One Deseret word -> { word, alternatives } */
  function reverseWord(token, dialect, opts) {
    const idx = build(dialect || 'general-us', opts);
    const list = idx.get(lower(token));
    if (!list || !list.length) return { word: token, alternatives: [], found: false };
    return {
      word: matchCase(token, list[0]),
      alternatives: list.slice(1).map((w) => matchCase(token, w)),
      found: true,
    };
  }

  /* A whole string, leaving punctuation, digits and unknown runs intact. */
  function reverseText(text, dialect, opts) {
    if (!text) return { text: '', ambiguous: [], unknown: [] };
    const ambiguous = [];
    const unknown = [];
    const out = text.replace(/[\u{10400}-\u{1044F}]+/gu, (tok) => {
      const r = reverseWord(tok, dialect, opts);
      if (!r.found) { unknown.push(tok); return tok; }
      if (r.alternatives.length) ambiguous.push({ deseret: tok, chosen: r.word, others: r.alternatives });
      return r.word;
    });
    return { text: out, ambiguous, unknown };
  }

  const looksDeseret = (s) => DESERET_CHAR.test(s || '');

  root.deseretReverseWord = reverseWord;
  root.deseretReverseText = reverseText;
  root.deseretLooksDeseret = looksDeseret;
})(typeof window !== 'undefined' ? window : self);
