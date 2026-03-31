#!/usr/bin/env sh
set -eu

normalize_pkg_name() {
  printf '%s' "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed 's/[^a-z0-9._-]/-/g; s/-\{2,\}/-/g; s/^-//; s/-$//'
}

if [ -f "package.json" ]; then
  current_pkg_name="$(node -p "JSON.parse(require('fs').readFileSync('package.json', 'utf8')).name" 2>/dev/null || true)"
  detected_pkg_name="$(normalize_pkg_name "$(basename "$PWD")")"
  target_pkg_name="${PROJECT_NAME:-}"

  # Auto-name only when the package name is empty or still using boilerplate default.
  if [ -z "$target_pkg_name" ] && { [ -z "$current_pkg_name" ] || [ "$current_pkg_name" = "brainstax" ]; }; then
    target_pkg_name="$detected_pkg_name"
  fi

  if [ -n "$target_pkg_name" ]; then
    target_pkg_name="$(normalize_pkg_name "$target_pkg_name")"
    if [ -n "$target_pkg_name" ] && [ "$target_pkg_name" != "$current_pkg_name" ]; then
      echo "Updating package.json name: $current_pkg_name -> $target_pkg_name"
      npm pkg set "name=$target_pkg_name" >/dev/null
    fi
  fi
fi

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
