// Dedicated benchmark server for apple-to-apple comparison with FastAPI/Express.
//
// Why this exists separately from tour-server:
//   - Uses database/sql directly (no GORM) to match the raw-driver style of
//     asyncpg (Python) and node-postgres (Node.js).
//   - Three endpoints execute exactly the same SQL as the FastAPI and Express
//     implementations in sibling folders.
//   - No middleware on the hot path (no JWT, no rate limiting, no logging).
//
// Echo is kept as the HTTP framework because that matches the production
// project, and Express/FastAPI are also opinionated frameworks (this is a
// runtime+language comparison, not "raw net/http vs anything").
package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"
	_ "github.com/lib/pq"
)

var db *sql.DB

func main() {
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		dsn = "host=localhost port=5432 user=touruser password=tourpass123 dbname=tourdb sslmode=disable"
	}

	var err error
	db, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("open: %v", err)
	}
	// Mirror the FastAPI / Express pool sizes so connection-pool capacity is
	// equal across all three implementations.
	db.SetMaxOpenConns(20)
	db.SetMaxIdleConns(5)

	if err := db.Ping(); err != nil {
		log.Fatalf("ping: %v", err)
	}

	e := echo.New()
	e.HideBanner = true
	e.HidePort = true

	e.GET("/tours", listTours)
	e.GET("/tours/:id", getTour)
	e.GET("/search", search)

	port := os.Getenv("PORT")
	if port == "" {
		port = "9000"
	}
	log.Printf("Go benchmark server listening on :%s", port)
	e.Logger.Fatal(e.Start(":" + port))
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /tours — list active tours (same SQL as FastAPI / Express)
// ─────────────────────────────────────────────────────────────────────────────
type tourCard struct {
	ID       int64   `json:"id"`
	Title    string  `json:"title"`
	Price    float64 `json:"price"`
	Rating   float64 `json:"rating"`
	ImageSrc string  `json:"imageSrc"`
}

func listTours(c echo.Context) error {
	const q = `
		SELECT tours.id, tours.title, tours.price, tours.rating,
		       COALESCE(tour_card_images.image_src, 'no-image.jpg') AS image_src
		FROM tours
		LEFT JOIN tour_card_images ON tours.id = tour_card_images.tour_id
		WHERE tours.status_id = (SELECT id FROM statuses WHERE name = 'active')
		ORDER BY tours.id ASC
	`
	rows, err := db.QueryContext(c.Request().Context(), q)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, errResp("query"))
	}
	defer rows.Close()

	out := make([]tourCard, 0, 32)
	for rows.Next() {
		var t tourCard
		if err := rows.Scan(&t.ID, &t.Title, &t.Price, &t.Rating, &t.ImageSrc); err != nil {
			return c.JSON(http.StatusInternalServerError, errResp("scan"))
		}
		out = append(out, t)
	}
	return c.JSON(http.StatusOK, out)
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /tours/:id — same SQL as FastAPI / Express
// ─────────────────────────────────────────────────────────────────────────────
type tourDetail struct {
	ID                  int64    `json:"id"`
	Title               string   `json:"title"`
	Description         string   `json:"description"`
	CallToAction        string   `json:"call_to_action"`
	Price               float64  `json:"price"`
	Rating              float64  `json:"rating"`
	DetailedDescription string   `json:"detailed_description"`
	StatusID            int64    `json:"status_id"`
	Status              string   `json:"status"`
	DateFrom            *string  `json:"date_from"`
	DateTo              *string  `json:"date_to"`
	Duration            *float64 `json:"duration"`
	TotalSeats          int64    `json:"total_seats"`
	AvailableSeats      int64    `json:"available_seats"`
}

func getTour(c echo.Context) error {
	id := c.Param("id")
	const q = `
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
	`
	var t tourDetail
	var dateFrom, dateTo sql.NullString
	var duration sql.NullFloat64
	err := db.QueryRowContext(c.Request().Context(), q, id).Scan(
		&t.ID, &t.Title, &t.Description,
		&t.CallToAction, &t.Price, &t.Rating,
		&t.DetailedDescription, &t.StatusID,
		&t.Status,
		&dateFrom, &dateTo,
		&duration,
		&t.TotalSeats,
		&t.AvailableSeats,
	)
	if err == sql.ErrNoRows {
		return c.JSON(http.StatusNotFound, errResp("Tour not found"))
	}
	if err != nil {
		return c.JSON(http.StatusInternalServerError, errResp("query"))
	}
	if dateFrom.Valid {
		t.DateFrom = &dateFrom.String
	}
	if dateTo.Valid {
		t.DateTo = &dateTo.String
	}
	if duration.Valid {
		t.Duration = &duration.Float64
	}
	return c.JSON(http.StatusOK, t)
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /search — same SQL as FastAPI / Express
// ─────────────────────────────────────────────────────────────────────────────
type searchItem struct {
	ID       int64   `json:"id"`
	Title    string  `json:"title"`
	Price    float64 `json:"price"`
	Rating   float64 `json:"rating"`
	ImageSrc string  `json:"image_src"`
	Duration float64 `json:"duration"`
	Location string  `json:"location"`
}

type searchResp struct {
	Tours      []searchItem `json:"tours"`
	Total      int64        `json:"total"`
	Page       int          `json:"page"`
	Limit      int          `json:"limit"`
	TotalPages int64        `json:"totalPages"`
}

func search(c echo.Context) error {
	title := strings.TrimSpace(c.QueryParam("title"))
	minPriceStr := c.QueryParam("minPrice")
	maxPriceStr := c.QueryParam("maxPrice")

	page, _ := strconv.Atoi(c.QueryParam("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit < 1 || limit > 100 {
		limit = 12
	}

	var (
		conds  = []string{"tours.status_id = (SELECT id FROM statuses WHERE name = 'active')"}
		params []interface{}
	)

	if title != "" {
		params = append(params, "%"+title+"%", "%"+title+"%")
		conds = append(conds,
			"(tours.title ILIKE $"+strconv.Itoa(len(params)-1)+" OR tours.description ILIKE $"+strconv.Itoa(len(params))+")")
	}
	if minPriceStr != "" {
		if v, err := strconv.ParseFloat(minPriceStr, 64); err == nil {
			params = append(params, v)
			conds = append(conds, "tours.price >= $"+strconv.Itoa(len(params)))
		}
	}
	if maxPriceStr != "" {
		if v, err := strconv.ParseFloat(maxPriceStr, 64); err == nil {
			params = append(params, v)
			conds = append(conds, "tours.price <= $"+strconv.Itoa(len(params)))
		}
	}

	offset := (page - 1) * limit
	where := strings.Join(conds, " AND ")

	q := `
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
		WHERE ` + where + `
		ORDER BY tours.id ASC
		LIMIT ` + strconv.Itoa(limit) + ` OFFSET ` + strconv.Itoa(offset)

	countQ := "SELECT COUNT(*) FROM tours WHERE " + where

	rows, err := db.QueryContext(c.Request().Context(), q, params...)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, errResp("query"))
	}
	defer rows.Close()

	items := make([]searchItem, 0, limit)
	for rows.Next() {
		var it searchItem
		if err := rows.Scan(&it.ID, &it.Title, &it.Price, &it.Rating, &it.ImageSrc, &it.Duration, &it.Location); err != nil {
			return c.JSON(http.StatusInternalServerError, errResp("scan"))
		}
		items = append(items, it)
	}

	var total int64
	if err := db.QueryRowContext(c.Request().Context(), countQ, params...).Scan(&total); err != nil {
		return c.JSON(http.StatusInternalServerError, errResp("count"))
	}

	totalPages := int64(0)
	if total > 0 {
		totalPages = (total + int64(limit) - 1) / int64(limit)
	}

	return c.JSON(http.StatusOK, searchResp{
		Tours: items, Total: total, Page: page, Limit: limit, TotalPages: totalPages,
	})
}

func errResp(msg string) map[string]string { return map[string]string{"error": msg} }
