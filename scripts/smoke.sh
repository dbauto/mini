#!/usr/bin/env bash
# Browser smoke test for the V1 routes, in the light and the dark theme.
# Renders each route in headless Chrome and checks that the page built its main content and
# that every icon was drawn. Needs the static server on http://127.0.0.1:${PORT:-4173}.
#   BROWSER=/path/to/chrome scripts/smoke.sh
set -euo pipefail

BASE="http://127.0.0.1:${PORT:-4173}/"
BROWSER="${BROWSER:-$(command -v google-chrome || command -v google-chrome-stable || command -v chromium || command -v chromium-browser || true)}"
test -n "$BROWSER" || { echo "No Chrome/Chromium found. Set BROWSER." >&2; exit 2; }
OUT="$(mktemp -d)"
fail=0

# route | text that must be in the rendered page (one per line after the route)
check() {
  local scheme="$1" mode="$2" route="$3"; shift 3
  local file="$OUT/$mode-$(echo "$route" | tr -c 'a-zA-Z0-9' '_').html"
  "$BROWSER" --headless --no-sandbox --disable-gpu "--blink-settings=preferredColorScheme=$scheme" \
    --virtual-time-budget=4000 --dump-dom "$BASE$route" >"$file" 2>/dev/null
  local ok=1
  grep -q "data-color-mode=\"$mode\"" "$file" || { echo "  ✗ $mode $route: theme not applied"; ok=0; }
  if grep -q '<i data-lucide' "$file"; then echo "  ✗ $mode $route: icon not drawn: $(grep -o '<i data-lucide="[a-z0-9-]*"' "$file" | sort -u | tr '\n' ' ')"; ok=0; fi
  for text in "$@"; do grep -qF -- "$text" "$file" || { echo "  ✗ $mode $route: missing \"$text\""; ok=0; }; done
  if [ "$ok" = 1 ]; then echo "  ✓ $mode $route"; else fail=1; fi
}

for theme in "1 light" "0 dark"; do
  set -- $theme; scheme="$1"; mode="$2"
  check "$scheme" "$mode" '#/overview' 'Document control activity and items requiring attention.' 'New / Revise Document' \
    'Document Workflow' 'Needs Attention' 'Document Control Health' 'My Work' 'Recent Activity' 'class="ui-stat ui-metric feature"' 'data-nav="review"'
  check "$scheme" "$mode" '#/review' 'Documents in Review' 'id="tb-v1-wf"' 'aria-label="Due date"'
  check "$scheme" "$mode" '#/review?show=all&due=overdue' 'id="tb-v1-wf"' 'Open Review'      # the link behind "tasks past their due date"
  check "$scheme" "$mode" '#/documents' '<h1 tabindex="-1"' 'Document ID' 'New / Revise Document'
  check "$scheme" "$mode" '#/review/WF-118' 'Complete Technical Review' 'class="paper'
done

rm -rf "$OUT"
exit "$fail"
