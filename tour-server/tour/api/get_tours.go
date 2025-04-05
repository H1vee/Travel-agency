package api

import (
	"net/http"
	"tour-server/tour/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// GetTours returns an Echo handler function that retrieves all tours
// from the database with all their fields
func GetTours(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Check if database connection is valid
		if db == nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Database connection is nil"})
		}

		// Query the database for all tours
		var tours []models.Tour
		err := db.Table("tours").
			Select("*").
			Find(&tours).Error

		// Handle database errors
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch tours",
			})
		}

		// Return all tours as JSON with HTTP 200 OK status
		return c.JSON(http.StatusOK, tours)
	}
}
