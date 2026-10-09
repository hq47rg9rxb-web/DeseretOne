#!/usr/bin/env bash
# Merges deseret-mappings.js + reverse.js into deseret.js and updates index.html.
# Run from the folder containing all three files:  bash combine.sh
set -euo pipefail

HTML="${1:-index.html}"

for f in deseret-mappings.js reverse.js "$HTML"; do
  [ -f "$f" ] || { echo "Missing $f"; exit 1; }
done

# 1. Combine. Order matters: the dictionary and translator come first,
#    reverse.js reads window.DESERET_MAPPINGS and translateWordWithDialect.
{
  echo "/* deseret.js - combined build."
  echo " * Part 1: deseret-mappings.js (dictionary, letter-to-sound engine, translator)"
  echo " * Part 2: reverse.js (Deseret back to English)"
  echo " * Keep them in this order. */"
  echo
  echo "/* ===== PART 1: deseret-mappings.js ===== */"
  cat deseret-mappings.js
  printf '\n\n'
  echo "/* ===== PART 2: reverse.js ===== */"
  cat reverse.js
  printf '\n'
} > deseret.js

# 2. Back up the HTML, then swap the two script tags for one.
cp "$HTML" "$HTML.bak"

python3 - "$HTML" <<'PY'
import re, sys
path = sys.argv[1]
s = open(path, encoding='utf-8').read()

old_tags = re.compile(
    r'[ \t]*<script src="deseret-mappings\.js"></script>\s*\n'
    r'[ \t]*<script src="reverse\.js"></script>'
)
new_tag = (
    '  <!-- deseret.js is deseret-mappings.js + reverse.js combined into one file\n'
    '       (dictionary and translator first, then the reverse translator). -->\n'
    '  <script src="deseret.js"></script>'
)
s, n = old_tags.subn(new_tag, s)
if n != 1:
    sys.exit('Could not find the two <script> tags to replace')

# 3. Update a few user-facing strings that refer to the old split files.
s = s.replace('deseret-mappings.js did not load', 'deseret.js did not load')
s = s.replace('(deseret-mappings.js)', '(deseret.js)')
s = s.replace('Check that deseret-mappings.js sits beside this page',
              'Check that deseret.js sits beside this page')
s = s.replace('reverse.js did not load', 'deseret.js did not load')
s = s.replace('with reverse.js.', 'with the reverse translator.')
s = s.replace('checks it with reverse.js', 'checks it with the reverse translator')

open(path, 'w', encoding='utf-8').write(s)
print('Updated', path)
PY

echo "Wrote deseret.js ($(wc -c < deseret.js) bytes). Backup: $HTML.bak"
echo "You can now delete deseret-mappings.js and reverse.js."
