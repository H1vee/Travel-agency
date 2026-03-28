package api

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type SearchTourItem struct {
	ID            uint    `json:"id" gorm:"column:id"`
	Title         string  `json:"title" gorm:"column:title"`
	Price         float64 `json:"price" gorm:"column:price"`
	Rating        float64 `json:"rating" gorm:"column:rating"`
	ImageSrc      string  `json:"image_src" gorm:"column:image_src"`
	Duration      float64 `json:"duration" gorm:"column:duration"`
	Location      string  `json:"location" gorm:"column:location"`
	BookingsCount int     `json:"bookings_count" gorm:"column:bookings_count"`
	IsHit         bool    `json:"is_hit" gorm:"-"`
	IsNew         bool    `json:"is_new" gorm:"-"`
}

type SearchResult struct {
	Tours      []SearchTourItem `json:"tours"`
	Total      int              `json:"total"`
	Page       int              `json:"page"`
	Limit      int              `json:"limit"`
	TotalPages int              `json:"totalPages"`
}

func SearchTours(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		searchTitle := strings.TrimSpace(c.QueryParam("title"))
		minPriceStr := c.QueryParam("minPrice")
		maxPriceStr := c.QueryParam("maxPrice")
		minDurationStr := c.QueryParam("minDuration")
		maxDurationStr := c.QueryParam("maxDuration")
		ratingsStr := c.QueryParam("ratings")
		regionStr := c.QueryParam("region")
		pageStr := c.QueryParam("page")
		limitStr := c.QueryParam("limit")
		sortBy := c.QueryParam("sortBy")

		page, limit := 1, 12
		if v, err := strconv.Atoi(pageStr); err == nil && v > 0 { page = v }
		if v, err := strconv.Atoi(limitStr); err == nil && v > 0 && v <= 100 { limit = v }

		base := db.Table("tours").
			Select(`
				tours.id, tours.title, tours.price, tours.rating,
				COALESCE(tci.image_src, '/static/images/no-image.jpg') AS image_src,
				COALESCE((
					SELECT EXTRACT(DAY FROM (td.date_to - td.date_from))
					FROM tour_dates td WHERE td.tour_id = tours.id LIMIT 1
				), 0) AS duration,
				COALESCE((
					SELECT CONCAT(l.name, ', ', l.country)
					FROM tour_dates td JOIN locations l ON td.to_location_id = l.id
					WHERE td.tour_id = tours.id LIMIT 1
				), '') AS location,
				COALESCE((
					SELECT COUNT(*) FROM bookings b
					JOIN tour_dates td ON b.tour_date_id = td.id
					WHERE td.tour_id = tours.id AND b.status IN ('pending','confirmed')
				), 0) AS bookings_count
			`).
			Joins("LEFT JOIN tour_card_images tci ON tci.tour_id = tours.id").
			Where("tours.status_id = (SELECT id FROM statuses WHERE name = 'active')")

		// Filters
		if searchTitle != "" {
			base = base.Where("tours.title ILIKE ? OR tours.description ILIKE ?",
				"%"+searchTitle+"%", "%"+searchTitle+"%")
		}

		if minPriceStr != "" {
			if v, err := strconv.ParseFloat(minPriceStr, 64); err == nil { base = base.Where("tours.price >= ?", v) }
		}
		if maxPriceStr != "" {
			if v, err := strconv.ParseFloat(maxPriceStr, 64); err == nil { base = base.Where("tours.price <= ?", v) }
		}

		if minDurationStr != "" || maxDurationStr != "" {
			minD, maxD := 0, 999
			if v, err := strconv.Atoi(minDurationStr); err == nil { minD = v }
			if v, err := strconv.Atoi(maxDurationStr); err == nil { maxD = v }
			base = base.Where(`EXISTS (
				SELECT 1 FROM tour_dates td
				WHERE td.tour_id = tours.id
				AND EXTRACT(DAY FROM (td.date_to - td.date_from)) BETWEEN ? AND ?
			)`, minD, maxD)
		}

		if ratingsStr != "" {
			parts := strings.Split(ratingsStr, ",")
			var conds []string
			var vals []interface{}
			for _, r := range parts {
				v, err := strconv.Atoi(strings.TrimSpace(r))
				if err != nil { continue }
				if v == 5 {
					conds = append(conds, "tours.rating >= 5")
				} else {
					conds = append(conds, "tours.rating >= ? AND tours.rating < ?")
					vals = append(vals, float64(v), float64(v+1))
				}
			}
			if len(conds) > 0 {
				base = base.Where("("+strings.Join(conds, " OR ")+")", vals...)
			}
		}

		regionMap := map[string][]string{
			"1": {"Україна", "Ukraine"},
			"2": {"Франція", "Італія", "Іспанія", "Німеччина", "Польща", "Нідерланди", "Греція",
				"France", "Italy", "Spain", "Germany", "Poland", "Netherlands", "Greece"},
			"3": {"Китай", "Японія", "Таїланд", "Тайвань", "Індія", "Сінгапур",
				"China", "Japan", "Thailand", "Taiwan", "India", "Singapore"},
			"4": {"США", "Канада", "Мексика", "Бразилія",
				"USA", "United States", "Canada", "Mexico", "Brazil"},
			"5": {"ОАЕ", "Туреччина", "Єгипет", "Ізраїль",
				"UAE", "Turkey", "Egypt", "Israel"},
			"6": {"Австралія", "Нова Зеландія", "Australia", "New Zealand"},
		}

		if regionStr != "" {
			var regionNames []string
			for _, id := range strings.Split(regionStr, ",") {
				if names, ok := regionMap[strings.TrimSpace(id)]; ok {
					regionNames = append(regionNames, names...)
				}
			}
			if len(regionNames) > 0 {
				base = base.Where(`EXISTS (
					SELECT 1 FROM tour_dates td
					JOIN locations l ON td.to_location_id = l.id
					WHERE td.tour_id = tours.id AND l.country IN ?
				)`, regionNames)
			}
		}

		// Count
		var total int64
		if err := base.Count(&total).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Count error"})
		}

		// Sort
		switch sortBy {
		case "price_asc":
			base = base.Order("tours.price ASC")
		case "price_desc":
			base = base.Order("tours.price DESC")
		case "rating_desc":
			base = base.Order("CASE WHEN tours.rating IS NULL OR tours.rating = 0 THEN 1 ELSE 0 END ASC, tours.rating DESC, tours.id DESC")
		case "newest":
			base = base.Order("tours.id DESC")
		case "popular":
			base = base.Order("bookings_count DESC, tours.rating DESC")
		default:
			base = base.Order("CASE WHEN tours.rating IS NULL OR tours.rating = 0 THEN 1 ELSE 0 END ASC, tours.rating DESC, tours.price ASC")
		}

		offset := (page - 1) * limit
		var tours []SearchTourItem
		if err := base.Offset(offset).Limit(limit).Find(&tours).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Search error"})
		}

		// Mark hits (top-3 by bookings) and new (top-3 by id)
		// Find global top bookings for hit marking
		type topTour struct {
			ID            uint `gorm:"column:id"`
			BookingsCount int  `gorm:"column:bookings_count"`
		}
		var topHits []topTour
		db.Table("tours").
			Select(`tours.id, COALESCE((
				SELECT COUNT(*) FROM bookings b
				JOIN tour_dates td ON b.tour_date_id = td.id
				WHERE td.tour_id = tours.id AND b.status IN ('pending','confirmed')
			), 0) AS bookings_count`).
			Where("tours.status_id = (SELECT id FROM statuses WHERE name = 'active')").
			Order("bookings_count DESC").
			Limit(3).
			Find(&topHits)

		hitIDs := make(map[uint]bool)
		for _, h := range topHits {
			if h.BookingsCount >= 3 { hitIDs[h.ID] = true }
		}

		var topNew []topTour
		db.Table("tours").Select("id").
			Where("tours.status_id = (SELECT id FROM statuses WHERE name = 'active')").
			Order("id DESC").Limit(3).Find(&topNew)
		newIDs := make(map[uint]bool)
		for _, n := range topNew { newIDs[n.ID] = true }

		for i := range tours {
			tours[i].IsHit = hitIDs[tours[i].ID]
			tours[i].IsNew = newIDs[tours[i].ID]
		}

		totalPages := int((total + int64(limit) - 1) / int64(limit))
		return c.JSON(http.StatusOK, SearchResult{
			Tours: tours, Total: int(total),
			Page: page, Limit: limit, TotalPages: totalPages,
		})
	}
}