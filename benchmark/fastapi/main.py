"""
FastAPI implementation of three endpoints for apple-to-apple benchmarking against
Go + Echo. Uses asyncpg (the fastest PostgreSQL driver for Python). Queries are
identical to those in the Go implementation.
"""
import os
from typing import Optional

import asyncpg
from fastapi import FastAPI, HTTPException, Query

DB_DSN = os.getenv(
    "DB_DSN",
    "postgresql://touruser:tourpass123@localhost:5432/tourdb",
)

app = FastAPI(docs_url=None, redoc_url=None)
pool: asyncpg.Pool | None = None


@app.on_event("startup")
async def startup() -> None:
    global pool
    pool = await asyncpg.create_pool(dsn=DB_DSN, min_size=5, max_size=20)


@app.on_event("shutdown")
async def shutdown() -> None:
    if pool:
        await pool.close()


# ──────────────────────────────────────────────────────────────────────────────
# GET /tours — list active tours (matches GetToursForCards in Go)
# ──────────────────────────────────────────────────────────────────────────────
@app.get("/tours")
async def list_tours():
    sql = """
        SELECT tours.id, tours.title, tours.price, tours.rating,
               COALESCE(tour_card_images.image_src, 'no-image.jpg') AS "imageSrc"
        FROM tours
        LEFT JOIN tour_card_images ON tours.id = tour_card_images.tour_id
        WHERE tours.status_id = (SELECT id FROM statuses WHERE name = 'active')
        ORDER BY tours.id ASC
    """
    async with pool.acquire() as conn:
        rows = await conn.fetch(sql)
        return [dict(r) for r in rows]


# ──────────────────────────────────────────────────────────────────────────────
# GET /tours/{id} — single tour with JOINs (matches GetTourById in Go)
# ──────────────────────────────────────────────────────────────────────────────
@app.get("/tours/{tour_id}")
async def get_tour(tour_id: int):
    sql = """
        SELECT tours.id, tours.title, tours.description,
               tours.call_to_action, tours.price, tours.rating,
               tours.detailed_description, tours.status_id,
               statuses.name AS status,
               tour_dates.date_from, tour_dates.date_to,
               EXTRACT(DAY FROM (tour_dates.date_to - tour_dates.date_from)) AS duration,
               tours.total_seats,
               COALESCE(tour_seats.available_seats, tours.total_seats) AS available_seats
        FROM tours
        JOIN statuses ON tours.status_id = statuses.id
        LEFT JOIN tour_dates ON tours.id = tour_dates.tour_id
        LEFT JOIN tour_seats ON tour_dates.id = tour_seats.tour_date_id
        WHERE tours.id = $1
        LIMIT 1
    """
    async with pool.acquire() as conn:
        row = await conn.fetchrow(sql, tour_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Tour not found")
        return dict(row)


# ──────────────────────────────────────────────────────────────────────────────
# GET /search — search with filters (matches SearchTours in Go, simplified)
# ──────────────────────────────────────────────────────────────────────────────
@app.get("/search")
async def search_tours(
    title: Optional[str] = None,
    minPrice: Optional[float] = None,
    maxPrice: Optional[float] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
):
    conds = ["tours.status_id = (SELECT id FROM statuses WHERE name = 'active')"]
    params: list = []

    if title:
        params.append(f"%{title}%")
        params.append(f"%{title}%")
        conds.append(f"(tours.title ILIKE ${len(params)-1} OR tours.description ILIKE ${len(params)})")

    if minPrice is not None:
        params.append(minPrice)
        conds.append(f"tours.price >= ${len(params)}")

    if maxPrice is not None:
        params.append(maxPrice)
        conds.append(f"tours.price <= ${len(params)}")

    offset = (page - 1) * limit
    where_clause = " AND ".join(conds)

    sql = f"""
        SELECT tours.id, tours.title, tours.price, tours.rating,
               COALESCE(tci.image_src, '/static/images/no-image.jpg') AS image_src,
               COALESCE((
                   SELECT EXTRACT(DAY FROM (td.date_to - td.date_from))
                   FROM tour_dates td WHERE td.tour_id = tours.id LIMIT 1
               ), 0) AS duration,
               COALESCE((
                   SELECT CONCAT(l.name, ', ', l.country)
                   FROM tour_dates td
                   JOIN locations l ON td.to_location_id = l.id
                   WHERE td.tour_id = tours.id LIMIT 1
               ), '') AS location
        FROM tours
        LEFT JOIN tour_card_images tci ON tci.tour_id = tours.id
        WHERE {where_clause}
        ORDER BY tours.id ASC
        LIMIT {limit} OFFSET {offset}
    """

    count_sql = f"SELECT COUNT(*) FROM tours WHERE {where_clause}"

    async with pool.acquire() as conn:
        rows = await conn.fetch(sql, *params)
        total = await conn.fetchval(count_sql, *params)

    return {
        "tours": [dict(r) for r in rows],
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": (total + limit - 1) // limit if total else 0,
    }
