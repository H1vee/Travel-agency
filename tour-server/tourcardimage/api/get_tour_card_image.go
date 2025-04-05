package api

import (
	"log"
	"net/http"
	"tour-server/tourcardimage/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// GetTourCardImages returns an Echo handler function that retrieves all tour card images
// from the database with all their fields
func GetTourCardImages(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Check if database connection is valid
		if db == nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Database connection is nil"})
		}

		// Query the database for all tour card images
		var TourImage []models.TourCardImage
		err := db.Debug().Table("tour_card_images").Select("*").Find(&TourImage).Error

		// Handle database errors
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch tours",
			})
		}

		// Log each fetched tour card image for debugging
		for _, tour := range TourImage {
			log.Printf("Fetched tour: %+v", tour)
		}

		// Return all tour card images as JSON with HTTP 200 OK status
		return c.JSON(http.StatusOK, TourImage)
	}
}
