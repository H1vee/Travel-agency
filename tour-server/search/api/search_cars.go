package api

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type SearchCarItem struct {
	ID       uint    `json:"id" gorm:"column:id"`
	Make     string  `json:"make" gorm:"column:make"`
	Model    string  `json:"model" gorm:"column:model"`
	Year     int     `json:"year" gorm:"column:year"`
	Price    float64 `json:"price" gorm:"column:price"`
	Mileage  int     `json:"mileage" gorm:"column:mileage"`
	FuelType string  `json:"fuelType" gorm:"column:fuel_type"`
	BodyType string  `json:"bodyType" gorm:"column:body_type"`
	ImageSrc string  `json:"imageSrc" gorm:"column:image_src"`
}

type SearchResult struct {
	Cars       []SearchCarItem `json:"cars"`
	Total      int             `json:"total"`
	Page       int             `json:"page"`
	Limit      int             `json:"limit"`
	TotalPages int             `json:"totalPages"`
}

// SearchCars implements the catalogue search with all supported filters:
// make, body type, year, price, mileage, fuel type, engine capacity,
// battery capacity, seats, drive and transmission.
func SearchCars(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		q := c.QueryParam("q")

		page, limit := 1, 12
		if v, err := strconv.Atoi(c.QueryParam("page")); err == nil && v > 0 {
			page = v
		}
		if v, err := strconv.Atoi(c.QueryParam("limit")); err == nil && v > 0 && v <= 100 {
			limit = v
		}

		base := db.Table("cars").
			Select(`
				cars.id, cars.make, cars.model, cars.year, cars.price,
				cars.mileage, cars.fuel_type, cars.body_type,
				COALESCE(cci.image_src, '/static/no-image.jpg') AS image_src
			`).
			Joins("LEFT JOIN car_card_images cci ON cci.car_id = cars.id").
			Where("cars.status_id = (SELECT id FROM statuses WHERE name = 'active')")

		// Free-text search across make / model / description.
		if q = strings.TrimSpace(q); q != "" {
			like := "%" + q + "%"
			base = base.Where(
				"cars.make ILIKE ? OR cars.model ILIKE ? OR cars.description ILIKE ?",
				like, like, like,
			)
		}

		// Multi-value (comma separated) IN-filters.
		inFilter := func(col, param string) {
			if raw := c.QueryParam(param); raw != "" {
				var vals []string
				for _, v := range strings.Split(raw, ",") {
					if v = strings.TrimSpace(v); v != "" {
						vals = append(vals, v)
					}
				}
				if len(vals) > 0 {
					base = base.Where(col+" IN ?", vals)
				}
			}
		}
		inFilter("cars.make", "make")
		inFilter("cars.body_type", "bodyType")
		inFilter("cars.fuel_type", "fuelType")
		inFilter("cars.drive", "drive")
		inFilter("cars.transmission", "transmission")

		// Range filters.
		rangeFloat := func(col, param string, gte bool) {
			if v, err := strconv.ParseFloat(c.QueryParam(param), 64); err == nil {
				if gte {
					base = base.Where(col+" >= ?", v)
				} else {
					base = base.Where(col+" <= ?", v)
				}
			}
		}
		rangeFloat("cars.price", "minPrice", true)
		rangeFloat("cars.price", "maxPrice", false)
		rangeFloat("cars.year", "minYear", true)
		rangeFloat("cars.year", "maxYear", false)
		rangeFloat("cars.mileage", "minMileage", true)
		rangeFloat("cars.mileage", "maxMileage", false)
		rangeFloat("cars.engine_capacity", "minEngine", true)
		rangeFloat("cars.engine_capacity", "maxEngine", false)
		rangeFloat("cars.battery_capacity", "minBattery", true)
		rangeFloat("cars.battery_capacity", "maxBattery", false)

		// Seats (exact, multi-value).
		inFilter("cars.seats", "seats")

		// Count before pagination.
		var total int64
		if err := base.Count(&total).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Count error"})
		}

		// Sort.
		switch c.QueryParam("sortBy") {
		case "price_asc":
			base = base.Order("cars.price ASC")
		case "price_desc":
			base = base.Order("cars.price DESC")
		case "year_desc":
			base = base.Order("cars.year DESC")
		case "year_asc":
			base = base.Order("cars.year ASC")
		case "mileage_asc":
			base = base.Order("cars.mileage ASC")
		default:
			base = base.Order("cars.id DESC")
		}

		offset := (page - 1) * limit
		var cars []SearchCarItem
		if err := base.Offset(offset).Limit(limit).Find(&cars).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Search error"})
		}

		totalPages := int((total + int64(limit) - 1) / int64(limit))
		return c.JSON(http.StatusOK, SearchResult{
			Cars: cars, Total: int(total),
			Page: page, Limit: limit, TotalPages: totalPages,
		})
	}
}
