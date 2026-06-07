package api

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// FilterOptions describes the values available to populate the catalogue
// filter controls, derived from the active inventory.
type FilterOptions struct {
	Makes         []string `json:"makes"`
	BodyTypes     []string `json:"bodyTypes"`
	FuelTypes     []string `json:"fuelTypes"`
	Drives        []string `json:"drives"`
	Transmissions []string `json:"transmissions"`
	Seats         []int    `json:"seats"`
	MinPrice      float64  `json:"minPrice"`
	MaxPrice      float64  `json:"maxPrice"`
	MinYear       int      `json:"minYear"`
	MaxYear       int      `json:"maxYear"`
	MinMileage    int      `json:"minMileage"`
	MaxMileage    int      `json:"maxMileage"`
}

// GetFilterOptions returns the distinct values and numeric bounds present in the
// active catalogue so the front-end can build its filter UI dynamically.
func GetFilterOptions(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		activeFilter := "status_id = (SELECT id FROM statuses WHERE name = 'active')"

		distinctStr := func(col string) []string {
			var out []string
			db.Table("cars").
				Distinct(col).
				Where(activeFilter).
				Where(col+" IS NOT NULL AND "+col+" <> ''").
				Order(col + " ASC").
				Pluck(col, &out)
			return out
		}

		var seats []int
		db.Table("cars").
			Distinct("seats").
			Where(activeFilter).
			Where("seats IS NOT NULL AND seats > 0").
			Order("seats ASC").
			Pluck("seats", &seats)

		var bounds struct {
			MinPrice   float64
			MaxPrice   float64
			MinYear    int
			MaxYear    int
			MinMileage int
			MaxMileage int
		}
		db.Table("cars").
			Select(`
				COALESCE(MIN(price), 0)   AS min_price,
				COALESCE(MAX(price), 0)   AS max_price,
				COALESCE(MIN(year), 0)    AS min_year,
				COALESCE(MAX(year), 0)    AS max_year,
				COALESCE(MIN(mileage), 0) AS min_mileage,
				COALESCE(MAX(mileage), 0) AS max_mileage
			`).
			Where(activeFilter).
			Scan(&bounds)

		return c.JSON(http.StatusOK, FilterOptions{
			Makes:         distinctStr("make"),
			BodyTypes:     distinctStr("body_type"),
			FuelTypes:     distinctStr("fuel_type"),
			Drives:        distinctStr("drive"),
			Transmissions: distinctStr("transmission"),
			Seats:         seats,
			MinPrice:      bounds.MinPrice,
			MaxPrice:      bounds.MaxPrice,
			MinYear:       bounds.MinYear,
			MaxYear:       bounds.MaxYear,
			MinMileage:    bounds.MinMileage,
			MaxMileage:    bounds.MaxMileage,
		})
	}
}
