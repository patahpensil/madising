#!/usr/bin/env bash
set -euo pipefail
if [[ "$(id -u)" == 0 ]]; then echo 'Build as a non-root release user.' >&2; exit 1; fi
root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
if [[ "$(node -p 'process.versions.node.split(".")[0]')" != 22 ]]; then echo 'Node.js 22 required.' >&2; exit 1; fi
for app in staging-api staging-web; do
  if [[ ! -f "$root/apps/$app/package-lock.json" ]]; then echo "Missing reviewed lockfile: $app" >&2; exit 1; fi
done
for app in staging-api staging-web; do
  (
    cd "$root/apps/$app"
    npm ci --include=dev --no-fund --no-audit
    npm audit --audit-level=high
    npm run build
  )
done
