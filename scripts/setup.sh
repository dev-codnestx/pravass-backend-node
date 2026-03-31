#!/usr/bin/env sh
set -eu

if [ -f ".nvmrc" ] && command -v node >/dev/null 2>&1; then
  required_node="$(cat .nvmrc | tr -d 'v[:space:]')"
  current_node="$(node -v | tr -d 'v[:space:]')"
  if [ -n "$required_node" ] && [ "$required_node" != "$current_node" ]; then
    echo "Warning: .nvmrc expects Node $required_node, current is $current_node"
  fi
fi

echo "Installing dependencies..."
npm install --no-audit --no-fund

echo "Installing Git hooks..."
npm run prepare

if [ ! -f ".env.dev" ] && [ -f ".env.example" ]; then
  cp .env.example .env.dev
  echo "Created .env.dev from .env.example"
fi

echo "Setup complete."
