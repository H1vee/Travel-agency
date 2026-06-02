# Apple-to-Apple Benchmark

Cross-language performance comparison of three identical REST endpoints
implemented in **Go + Echo** (existing), **Python + FastAPI**, and
**Node.js + Express**.

All three implementations:

- Connect to the **same PostgreSQL** database with the **same data**.
- Expose the **same three endpoints** with **identical SQL queries**.
- Are tested with the **same `hey` parameters** on the **same machine**.

This guarantees apple-to-apple comparison: any difference in RPS / latency
is attributable to the language, runtime, and framework — not to query
optimization, schema, or data volume.

## Endpoints

| Endpoint | Description | What it stresses |
|---|---|---|
| `GET /tours` | List active tours with cover image | Simple SELECT + LEFT JOIN, JSON serialization |
| `GET /tours/:id` | Single tour with status / dates / seats | Multiple JOINs |
| `GET /search?title=...` | Search with filters & pagination | Dynamic SQL with parameter binding |

## Prerequisites

- PostgreSQL with `tourdb` already seeded (the same DB used by the Go server).
- `hey` load tester installed (`go install github.com/rakyll/hey@latest`).
- Python 3.10+, Node.js 18+, Go 1.21+.

## 1. Start the three servers

Open **three terminals**, leave them running.

### Go + Echo (existing project)

```bash
cd tour-server
go run server.go            # listens on :1323
```

### Python + FastAPI

```bash
cd benchmark/fastapi
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8000 --no-access-log --workers 1
```

### Node.js + Express

```bash
cd benchmark/express
npm install
PORT=3001 node server.js
```

## 2. Run the benchmark

```bash
cd benchmark
./run_benchmark.sh
```

The script:

1. Performs a **warm-up pass** (50 requests per endpoint, results discarded)
   so JIT, connection pools, and OS file caches are primed.
2. Performs the **measured pass** (500 requests, 10 concurrent connections).
3. Prints a summary table and saves raw `hey` output to `results_<timestamp>/`.

### Environment overrides

```bash
REQUESTS=1000 CONCURRENCY=20 TOUR_ID=5 SEARCH_TITLE=Dubai ./run_benchmark.sh
```

## 3. Fairness checklist

Before quoting numbers in the thesis, confirm:

- [ ] All three servers run on the **same physical machine** (laptop, VM, etc.).
- [ ] Each server has **logging disabled** (Go: `cfg.App.Debug = false`;
      FastAPI: `--no-access-log`; Express: no `morgan`).
- [ ] Each server is started **fresh** (no other heavy processes running).
- [ ] PostgreSQL is the **same instance** for all three.
- [ ] `hey` is invoked with the **same `-n` and `-c`** parameters.
- [ ] **Warm-up pass** was performed (the script does this automatically).

## 4. Expected pattern of results

Typical apple-to-apple comparison of these stacks shows:

- **Go + Echo**: highest RPS, lowest tail latency (compiled, lightweight goroutines).
- **Node.js + Express**: middle ground (V8 JIT, event loop, single-threaded JS).
- **Python + FastAPI**: lower RPS but competitive latency thanks to asyncpg + uvloop.

The actual numbers depend on the hardware, OS, network stack, and database
warm-up state. What matters for the thesis is the **relative difference**
on **your** machine in **your** conditions.

## 5. Filing results into the thesis

Suggested place: extend Section 4.3 ("Опис процесів тестування") or add a
new sub-section **4.X "Порівняльне навантажувальне тестування"** with:

- Description of the methodology (3 endpoints, 3 implementations, same DB).
- A table with the summary numbers from `run_benchmark.sh`.
- One paragraph of analysis (which stack performed how, and why).
