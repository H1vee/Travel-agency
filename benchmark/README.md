# Apple-to-Apple Benchmark

Cross-language performance comparison of three identical REST endpoints
implemented in **Go + Echo**, **Python + FastAPI**, and **Node.js + Express**.

> ⚠️ This compares **dedicated benchmark servers**, not the production
> `tour-server`. Each implementation is a thin handler that runs raw
> parameterized SQL against the **same PostgreSQL database**, with no
> authorization, no rate-limiting, and no logging middleware. The goal is
> to measure the **language runtime + HTTP framework + database driver**,
> isolating those layers from everything else.

## What is identical

- **Same database** (PostgreSQL `tourdb`).
- **Same data** (whichever rows are in the DB at the moment of the run).
- **Same SQL queries**, byte-for-byte, across all three implementations.
- **Same `hey` parameters** (`-n 500 -c 10` by default).
- **Same machine** (run them all locally in the VM you use).
- **Same raw-driver style for DB access** (no ORM in any of them):
  - Go uses `database/sql` + `lib/pq`.
  - Python uses `asyncpg`.
  - Node.js uses `node-postgres` (`pg`).
- **Same HTTP framework category** (opinionated minimal): Echo / FastAPI / Express.

## What is *not* identical (and why that's fine)

The connection-pool sizes and serialization paths are framework-idiomatic.
Forcing them to be identical would not make the comparison more apple-to-
apple, because in real life nobody hand-tunes asyncpg to mimic GORM. The
defaults are chosen to be comparable (5 idle / 20 max for all three).

## Endpoints

| Endpoint | Description | What it stresses |
|---|---|---|
| `GET /tours` | List active tours with cover image | Simple SELECT + LEFT JOIN, JSON serialization of many rows |
| `GET /tours/:id` | Single tour with status / dates / seats | Multiple JOINs |
| `GET /search?title=...` | Search with filters & pagination | Dynamic SQL with parameter binding |

## Prerequisites

- PostgreSQL with `tourdb` seeded (same DB used by `tour-server`).
- `hey` load tester: `go install github.com/rakyll/hey@latest`.
- Go 1.21+, Python 3.10+, Node.js 18+.

## 1. Install dependencies (one time)

```bash
# Go benchmark server
cd benchmark/go && go mod download && cd -

# Python benchmark server
cd benchmark/fastapi
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
deactivate && cd -

# Node benchmark server
cd benchmark/express && npm install && cd -
```

## 2. Start the three benchmark servers

Open **three terminals** (or three tmux panes), leave them running.

### Go (`database/sql` + Echo) — port 9000

```bash
cd benchmark/go
go run main.go
```

### Python + FastAPI (asyncpg) — port 8000

```bash
cd benchmark/fastapi
source .venv/bin/activate
uvicorn main:app --port 8000 --no-access-log --workers 1
```

### Node.js + Express (pg) — port 3001

```bash
cd benchmark/express
PORT=3001 node server.js
```

If your PostgreSQL DSN differs from the default, override it before starting:

```bash
export DB_DSN="postgresql://touruser:tourpass123@localhost:5432/tourdb"
```

## 3. Run the benchmark

```bash
cd benchmark
./run_benchmark.sh
```

The script:

1. Performs a **warm-up pass** (50 requests per endpoint, results discarded)
   so JIT compilers, connection pools, and the OS page cache are primed.
2. Performs the **measured pass** (500 requests, 10 concurrent connections).
3. Prints a summary table and saves raw `hey` output to `results_<timestamp>/`.

### Environment overrides

```bash
REQUESTS=1000 CONCURRENCY=20 TOUR_ID=5 SEARCH_TITLE=Dubai ./run_benchmark.sh
```

## 4. Fairness checklist

Before quoting numbers in the thesis, confirm:

- [ ] All three benchmark servers run on the **same physical machine** (laptop, VM, etc.).
- [ ] None of them are running with verbose logging (script flags handled above).
- [ ] PostgreSQL is the **same instance** for all three.
- [ ] `hey` is invoked with the **same `-n` and `-c`** parameters (the script handles this).
- [ ] **Warm-up pass** was performed (the script does this automatically).
- [ ] Tour ID used in `/tours/:id` exists in the DB (default `1`; override with `TOUR_ID=...`).
- [ ] No other heavy processes are running on the machine during the benchmark.

## 5. Filing results into the thesis

Suggested place: extend Section 4.3 ("Опис процесів тестування") or add a
new sub-section **4.X "Порівняльне навантажувальне тестування"** with:

- Description of the methodology (3 endpoints, 3 implementations, same DB,
  raw SQL through native driver in each language).
- A table with the summary numbers from `run_benchmark.sh`.
- One paragraph of analysis (which stack performed how, and why).
