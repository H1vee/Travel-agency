#!/usr/bin/env bash
# Runs hey against all three benchmark implementations sequentially.
#
# All three implementations are dedicated benchmark servers that execute
# IDENTICAL SQL and serve IDENTICAL endpoint shapes (no middleware, no
# auth, no extra logging). This isolates the comparison to the language
# runtime + HTTP framework + database driver, which is what the apple-to-
# apple benchmark is supposed to measure.
#
# Make sure all three benchmark servers are running BEFORE invoking this:
#   - Go (database/sql + Echo)  on port 9000
#   - FastAPI (asyncpg)         on port 8000
#   - Express (node-postgres)   on port 3001

set -euo pipefail

REQUESTS="${REQUESTS:-500}"
CONCURRENCY="${CONCURRENCY:-10}"
TOUR_ID="${TOUR_ID:-1}"      # ensure such a tour exists in DB
SEARCH_TITLE="${SEARCH_TITLE:-Dubai}"

OUT="results_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$OUT"

declare -A SERVERS=(
  [go]="http://localhost:9000"
  [fastapi]="http://localhost:8000"
  [express]="http://localhost:3001"
)

declare -A ENDPOINTS=(
  [tours]="/tours"
  [tour_by_id]="/tours/$TOUR_ID"
  [search]="/search?title=$SEARCH_TITLE"
)

get_endpoint() {
  echo "${ENDPOINTS[$2]}"
}

# Warm-up pass (so the first measured run isn't biased by JIT / GC / connection pool warmup)
echo "=== Warm-up pass (50 requests each, results discarded) ==="
for srv in "${!SERVERS[@]}"; do
  for ep in tours tour_by_id search; do
    url="${SERVERS[$srv]}$(get_endpoint "$srv" "$ep")"
    hey -n 50 -c "$CONCURRENCY" "$url" > /dev/null 2>&1 || true
  done
done

# Measured pass
echo "=== Measured pass ($REQUESTS requests, $CONCURRENCY concurrency) ==="
for srv in "${!SERVERS[@]}"; do
  for ep in tours tour_by_id search; do
    url="${SERVERS[$srv]}$(get_endpoint "$srv" "$ep")"
    label="${srv}__${ep}"
    echo "→ $label : $url"
    hey -n "$REQUESTS" -c "$CONCURRENCY" "$url" > "$OUT/$label.txt"
    sleep 1   # let connection pools settle between runs
  done
done

# Summary table
echo
echo "=== Summary ==="
printf "%-20s %-15s %-10s %-10s %-10s %-10s\n" "Server" "Endpoint" "RPS" "Avg(ms)" "P50(ms)" "P95(ms)"
for srv in go fastapi express; do
  for ep in tours tour_by_id search; do
    f="$OUT/${srv}__${ep}.txt"
    [[ -f "$f" ]] || continue
    rps=$(grep -i "Requests/sec:" "$f" | awk '{printf "%.0f", $2}')
    avg=$(grep -i "Average:" "$f" | head -n1 | awk '{printf "%.2f", $2*1000}')
    # Latency-distribution lines look like:  "  50% in 0.0058 secs"
    p50=$(awk '/Latency distribution:/{flag=1;next} flag && /50%/{printf "%.2f", $3*1000; exit}' "$f")
    p95=$(awk '/Latency distribution:/{flag=1;next} flag && /95%/{printf "%.2f", $3*1000; exit}' "$f")
    printf "%-20s %-15s %-10s %-10s %-10s %-10s\n" "$srv" "$ep" "$rps" "$avg" "$p50" "$p95"
  done
done

echo
echo "Raw outputs saved to: $OUT/"
