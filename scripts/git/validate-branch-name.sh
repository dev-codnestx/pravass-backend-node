#!/usr/bin/env sh
set -eu

branch_name="${1:-$(git symbolic-ref --short HEAD 2>/dev/null || true)}"

if [ -z "$branch_name" ]; then
  # Detached HEAD (tags/CI) should not fail this check.
  exit 0
fi

default_branches='^(master|development|develop)$'
feature_branches='^(feature|bugfix|hotfix|release)/[a-z0-9]+([._-][a-z0-9]+)*$'

if printf '%s' "$branch_name" | grep -Eq "$default_branches"; then
  exit 0
fi

if ! printf '%s' "$branch_name" | grep -Eq "$feature_branches"; then
  echo "Invalid branch name: $branch_name"
  echo "Use one of:"
  echo "  feature/short-description"
  echo "  bugfix/short-description"
  echo "  hotfix/short-description"
  echo "  release/sprint-1"
  echo "Allowed long-lived branches: master, development, develop"
  exit 1
fi
