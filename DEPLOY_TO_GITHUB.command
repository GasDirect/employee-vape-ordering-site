#!/bin/bash
# Upload this standalone website to the ALREADY CREATED GasDirect repository.
# Explicitly blocks any attempt to target the original employee-ordering-site.
# Refuses any pre-existing, non-starter files. Never force pushes or deletes existing files.
set -euo pipefail
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SOURCE_DIR"
OWNER='GasDirect'
REPO='employee-vape-ordering-site'
FULL="$OWNER/$REPO"
EXPECTED_ORIGIN="https://github.com/$FULL"
EXPECTED_SITE='https://gasdirect.github.io/employee-vape-ordering-site/'
printf '\nUpload Employee Vape Order Reference to %s\n' "$FULL"

for f in index.html data/products.json data/config.json backend/Code.gs; do
  if [[ ! -f "$SOURCE_DIR/$f" ]]; then
    printf 'ERROR: Missing %s. Run from the extracted website folder.\n' "$f" >&2
    exit 1
  fi
done
for tool in git gh rsync python3; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    printf 'ERROR: %s is required. Mac setup: xcode-select --install ; brew install gh\n' "$tool" >&2
    exit 1
  fi
done
if [[ -d "$SOURCE_DIR/.git" ]]; then
  echo 'ERROR: Source folder already has a .git directory. Please use a freshly extracted ZIP.' >&2
  exit 1
fi
if ! gh auth status >/dev/null 2>&1; then
  echo 'Sign in to your GitHub account through the browser.'
  gh auth login --hostname github.com --web --git-protocol https
fi
ACTUAL_OWNER="$(gh api user --jq .login)"
if [[ "$(printf %s "$ACTUAL_OWNER" | tr '[:upper:]' '[:lower:]')" != 'gasdirect' ]]; then
  printf 'ERROR: GitHub CLI is signed in as %s, not GasDirect.\n' "$ACTUAL_OWNER" >&2
  echo 'Run: gh auth switch -h github.com -u GasDirect (or gh auth login) and try again.' >&2
  exit 1
fi
if ! gh repo view "$FULL" --json nameWithOwner >/dev/null 2>&1; then
  printf 'ERROR: %s does not exist or your GitHub CLI lacks access.\n' "$FULL" >&2
  exit 1
fi
REMOTE_NAME="$(gh repo view "$FULL" --json nameWithOwner --jq .nameWithOwner)"
if [[ "$(printf %s "$REMOTE_NAME" | tr '[:upper:]' '[:lower:]')" != 'gasdirect/employee-vape-ordering-site' ]]; then
  printf 'ERROR: Unexpected destination %s. Aborting.\n' "$REMOTE_NAME" >&2
  exit 1
fi
VISIBILITY="$(gh repo view "$FULL" --json visibility --jq .visibility)"
if [[ "$VISIBILITY" != 'PUBLIC' ]]; then
  echo 'ERROR: Repository is not public. This package requires a public catalog for GitHub Pages + the Apps Script backend.' >&2
  echo 'If you need an employee-only site, do not publish it to public Pages; choose protected hosting.' >&2
  exit 1
fi
printf '\nThis will upload the website to:\n  %s\n' "$EXPECTED_ORIGIN"
printf 'No original website files will be accessed or changed.\n'
printf 'This is PUBLIC hosting; it does not authenticate employees.\n'
printf 'Type UPLOAD to continue: '
read -r ACK
if [[ "$ACK" != 'UPLOAD' ]]; then echo 'Cancelled.'; exit 1; fi

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
# Clone the existing repo instead of rewriting git history.
gh repo clone "$FULL" "$WORK/repo" -- --quiet
cd "$WORK/repo"
ORIGIN_URL="$(git remote get-url origin 2>/dev/null || true)"
case "$ORIGIN_URL" in
  "https://github.com/$FULL"|"https://github.com/$FULL.git"|"git@github.com:$FULL"|"git@github.com:$FULL.git") ;;
  *) printf 'ERROR: Unexpected Git remote: %s\n' "$ORIGIN_URL" >&2; exit 1 ;;
esac
# Only a newly created repo with the default README, .gitignore, or LICENSE may be updated.
# Never overwrite someone's existing website or a repo that has other files.
while IFS= read -r path; do
  [[ -z "$path" ]] && continue
  case "$path" in README.md|.gitignore|LICENSE|LICENSE.md|LICENSE.txt) ;;
    *) printf 'ERROR: Repo already has project files (%s). Aborting without changes.\n' "$path" >&2; exit 1 ;;
  esac
done < <(git ls-files)

# Copy the site (including hidden .github workflow and .nojekyll) with no deletions.
rsync -a --exclude='.git/' --exclude='.DS_Store' --exclude='._*' "$SOURCE_DIR/" "$WORK/repo/"
# Guard that email is not enabled in the uploaded release.
python3 - <<'PYCODE'
import json
cfg=json.load(open('data/config.json'))
assert cfg['appName']=='Employee Vape Order Reference', 'Unexpected app configuration.'
assert not cfg['backend']['appsScriptUrl'], 'Email must remain disabled for the initial publish.'
print('Email endpoint is empty: submission will remain disabled.')
PYCODE

# Newly created empty repositories might have no checked-out branch.
git checkout -B main >/dev/null 2>&1
# Avoid force pushes; remote non-fast-forward changes abort automatically.
git add -A
if git diff --cached --quiet; then
  echo 'All website files are already present; nothing to commit.'
else
  git -c user.name='GasDirect' -c user.email='284136099+GasDirect@users.noreply.github.com' \
      commit -m 'Publish standalone employee vape order reference' >/dev/null
  gh auth setup-git
  git push -u origin main
fi

printf '\nChecking GitHub Pages configuration...\n'
if gh api "repos/$FULL/pages" >/dev/null 2>&1; then
  echo 'GitHub Pages is already configured.'
else
  if gh api -X POST "repos/$FULL/pages" -f 'source[branch]=main' -f 'source[path]=/' --silent; then
    echo 'GitHub Pages configuration submitted.'
  else
    echo 'Could not configure Pages automatically. In repo Settings -> Pages choose Deploy from branch: main, /(root).'
  fi
fi
printf '\nRepository: %s\n' "$EXPECTED_ORIGIN"
printf 'Expected Pages URL after publication: %s\n' "$EXPECTED_SITE"
echo 'Email is still disabled. When you create a separate Apps Script project, use CONNECT_EMAIL_BACKEND.command.'
