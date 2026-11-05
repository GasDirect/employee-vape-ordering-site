#!/bin/bash
# Configure email ONLY for GasDirect/employee-vape-ordering-site after a NEW Google Apps Script deployment.
# Works with the ZIP folder without requiring it to be a local git repository.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OWNER='GasDirect'
FULL='GasDirect/employee-vape-ordering-site'
for tool in gh git python3; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    printf 'ERROR: Missing %s\n' "$tool" >&2
    exit 1
  fi
done
if ! gh auth status >/dev/null 2>&1; then
  gh auth login --hostname github.com --web --git-protocol https
fi
ACTUAL_OWNER="$(gh api user --jq .login)"
if [[ "$(printf %s "$ACTUAL_OWNER" | tr '[:upper:]' '[:lower:]')" != 'gasdirect' ]]; then
  echo "ERROR: CLI logged in as $ACTUAL_OWNER, not GasDirect" >&2
  exit 1
fi
printf '\nLink separate Google Apps Script backend to %s\n' "$FULL"
printf 'Only continue after publishing the NEW backend (never reuse the original store-order backend).\n'
printf 'Paste the new Google Apps Script /exec URL: '
read -r NEW_URL
python3 - "$NEW_URL" <<'PYCODE'
import re,sys
url=sys.argv[1].strip()
if not re.fullmatch(r'https://script\.google\.com/macros/s/[A-Za-z0-9_-]+/exec',url):
    raise SystemExit('Invalid web app URL (must end with /exec). No changes made.')
PYCODE
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
gh repo clone "$FULL" "$WORK/repo" -- --quiet
cd "$WORK/repo"
ORIGIN_URL="$(git remote get-url origin 2>/dev/null || true)"
case "$ORIGIN_URL" in
  "https://github.com/$FULL"|"https://github.com/$FULL.git"|"git@github.com:$FULL"|"git@github.com:$FULL.git") ;;
  *) echo "ERROR: Git remote is not the independent vape repository: $ORIGIN_URL" >&2; exit 1 ;;
esac
python3 - "$NEW_URL" <<'PYCODE'
from pathlib import Path
import json,sys
p=Path('data/config.json')
if not p.is_file(): raise SystemExit('ERROR: Missing data/config.json. First upload the website.')
d=json.loads(p.read_text())
if d.get('appName')!='Employee Vape Order Reference': raise SystemExit('ERROR: Wrong application. No changes made.')
old=d['backend']['appsScriptUrl']
url=sys.argv[1].strip()
if old and old!=url: raise SystemExit('ERROR: Backend already configured to a different URL. No changes made.')
d['backend']['appsScriptUrl']=url
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
print('Updated only the independent vape website configuration.')
PYCODE
git add data/config.json
if git diff --cached --quiet; then
  echo 'This URL is already configured. No change needed.'
  exit 0
fi
git -c user.name='GasDirect' -c user.email='284136099+GasDirect@users.noreply.github.com' \
  commit -m 'Link standalone vape order email backend' >/dev/null
gh auth setup-git
git push origin HEAD:main
printf '\nVape email backend URL committed. Test carefully before sharing with staff.\n'
