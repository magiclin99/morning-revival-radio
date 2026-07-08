#!/usr/bin/env bash
# Update db/data.xml from the upstream plist and rebuild src/components/db.json.
# Deterministic part of the /update skill. Run from repo root or anywhere; it cd's by script location.
set -euo pipefail

PLIST_URL="http://ezoecloud.twgbr.org/xmlapps/morning/plist/audiocloud_morning_tra_2024update.plist"

# repo root = two levels up from this script (.claude/skills/update/)
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT/db"

echo "==> [1/4] Ensuring db/ deps (xml2js)"
[ -d node_modules ] || npm install

echo "==> [2/4] Downloading latest plist"
echo "    $PLIST_URL"
tmp="$(mktemp)"
# -f: fail on HTTP errors so a 404/500 doesn't silently overwrite data.xml with an error page
curl -fsSL -m 60 "$PLIST_URL" -o "$tmp"
# sanity: must look like a plist
head -3 "$tmp" | grep -q "plist" || { echo "ERROR: downloaded file is not a plist"; head -5 "$tmp"; exit 1; }
mv "$tmp" data.xml
echo "    data.xml: $(wc -l < data.xml) lines"

echo "==> [3/4] Rebuilding src/components/db.json (node main.js)"
node main.js

echo "==> [4/4] Validating output"
cd "$ROOT"
node -e "JSON.parse(require('fs').readFileSync('src/components/db.json','utf8'))" \
  && echo "    JSON valid"
# no unconverted placeholders / insecure links should remain
if grep -q 'SERVERIP2' src/components/db.json; then echo "ERROR: residual SERVERIP2 in db.json"; exit 1; fi
if grep -q '"link": "http://' src/components/db.json; then echo "ERROR: residual http:// link in db.json"; exit 1; fi
echo "    no residual SERVERIP2 / http:// links"

echo ""
echo "Years now in db.json:"
grep -oE '"二〇[一二][0-9〇一二三四五六七八九十]*年"' src/components/db.json | sort -u | tr '\n' ' '
echo ""
echo ""
echo "git diff stat:"
git -C "$ROOT" diff --stat db/data.xml src/components/db.json || true
echo ""
echo "db update complete."
