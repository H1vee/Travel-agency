// Express + node-postgres implementation of three endpoints for apple-to-apple
// benchmarking against Go + Echo. Queries are identical to those in the Go
// implementation.

const express = require('express');
const { Pool } = require('pg');

const DB_DSN = process.env.DB_DSN ||
  'postgresql://touruser:tourpass123@localhost:5432/tourdb';

const pool = new Pool({
  connectionString: DB_DSN,
  max: 20,
  min: 5,
});

const app = express();

// ─────────────────────────────────────────────────────────────────────────────
// GET /tours — list active tours (matches GetToursForCards in Go)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/tours', async (req, res) => {
  try {
    const sql = `
      SELECT tours.id, tours.title, tours.price, tours.rating,
             COALESCE(tour_card_images.image_src, 'no-image.jpg') AS "imageSrc"
      FROM tours
      LEFT JOIN tour_card_images ON tours.id = tour_card_images.tour_id
      WHERE tours.status_id = (SELECT id FROM statuses WHERE name = 'active')
      ORDER BY tours.id ASC
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch tours' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /tours/:id — single tour with JOINs (matches GetTourById in Go)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/tours/:id', async (req, res) => {
  try {
    const sql = `
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
    `;
    const { rows } = await pool.query(sql, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Tour not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch tour' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /search — search with filters (matches SearchTours in Go, simplified)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/search', async (req, res) => {
  try {
    const { title, minPrice, maxPrice } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), 100);

    const conds = ["tours.status_id = (SELECT id FROM statuses WHERE name = 'active')"];
    const params = [];

    if (title) {
      params.push(`%${title}%`);
      params.push(`%${title}%`);
      conds.push(`(tours.title ILIKE $${params.length - 1} OR tours.description ILIKE $${params.length})`);
    }
    if (minPrice) {
      params.push(parseFloat(minPrice));
      conds.push(`tours.price >= $${params.length}`);
    }
    if (maxPrice) {
      params.push(parseFloat(maxPrice));
      conds.push(`tours.price <= $${params.length}`);
    }

    const offset = (page - 1) * limit;
    const whereClause = conds.join(' AND ');

    const sql = `
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
      WHERE ${whereClause}
      ORDER BY tours.id ASC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const countSql = `SELECT COUNT(*) FROM tours WHERE ${whereClause}`;

    const { rows } = await pool.query(sql, params);
    const { rows: countRows } = await pool.query(countSql, params);
    const total = parseInt(countRows[0].count, 10);

    res.json({
      tours: rows,
      total,
      page,
      limit,
      totalPages: total ? Math.ceil(total / limit) : 0,
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to search tours' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Express benchmark server running on port ${PORT}`);
});
