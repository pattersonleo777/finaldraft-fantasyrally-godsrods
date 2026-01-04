#!/usr/bin/env bash
set -euo pipefail

# Helper to set GitHub Actions secrets for this repo using `gh`.
# Requires: a PAT authenticated with `gh auth login --with-token` having `repo` & `workflow` permissions.
# Usage: edit values below or export env vars beforehand, then run from repo root.

REPO="pattersonleo777/finaldraft-fantasyrally-godsrods"

: ${JWT_SECRET:="${JWT_SECRET:-}"}
: ${STRIPE_SECRET_KEY:="${STRIPE_SECRET_KEY:-}"}
: ${STRIPE_WEBHOOK_SECRET:="${STRIPE_WEBHOOK_SECRET:-}"}
: ${VITE_STRIPE_PUBLISHABLE_KEY:="${VITE_STRIPE_PUBLISHABLE_KEY:-}"}

if [ -z "$JWT_SECRET" ] || [ -z "$STRIPE_SECRET_KEY" ] || [ -z "$STRIPE_WEBHOOK_SECRET" ] || [ -z "$VITE_STRIPE_PUBLISHABLE_KEY" ]; then
  echo "One or more required vars are empty. Either export them or edit this script." >&2
  exit 1
fi

gh secret set JWT_SECRET --repo "$REPO" --body "$JWT_SECRET"
gh secret set STRIPE_SECRET_KEY --repo "$REPO" --body "$STRIPE_SECRET_KEY"
gh secret set STRIPE_WEBHOOK_SECRET --repo "$REPO" --body "$STRIPE_WEBHOOK_SECRET"
gh secret set VITE_STRIPE_PUBLISHABLE_KEY --repo "$REPO" --body "$VITE_STRIPE_PUBLISHABLE_KEY"

echo "GitHub Actions secrets set (if gh authenticated with sufficient permissions)."
