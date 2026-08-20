#!/usr/bin/env bash
# One-shot push of this project to GitHub.
# Usage:  ./push.sh git@github.com:username/scheme-analysis.git
#   …or just run ./push.sh and paste the repo URL when prompted.
set -e

REPO_URL="${1:-}"
if [ -z "$REPO_URL" ]; then
  read -rp "Paste your GitHub repo URL (git@github.com:user/repo.git): " REPO_URL
fi

git init -q 2>/dev/null || true
git checkout -q -b main 2>/dev/null || true
git add .
git commit -q -m "Scheme Analysis page — mutual fund research terminal prototype" --allow-empty
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"

if git ls-remote --exit-code origin main >/dev/null 2>&1; then
  echo "Remote already has a main branch — merging first…"
  git pull origin main --allow-unrelated-histories --no-edit || true
fi

git push -u origin main
echo "✅ Pushed to $REPO_URL"
