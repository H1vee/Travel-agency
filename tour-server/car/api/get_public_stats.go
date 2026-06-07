package api

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// GetPublicStats returns headline figures for the home page (e.g. number of
// cars available, brands represented).
func GetPublicStats(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var totalCars int64
		db.Table("cars").
			Where("status_id = (SELECT id FROM statuses WHERE name = 'active')").
			Count(&totalCars)

		var totalBrands int64
		db.Table("cars").
			Where("status_id = (SELECT id FROM statuses WHERE name = 'active')").
			Distinct("make").
			Count(&totalBrands)

		return c.JSON(http.StatusOK, map[string]interface{}{
			"totalCars":   totalCars,
			"totalBrands": totalBrands,
		})
	}
}
