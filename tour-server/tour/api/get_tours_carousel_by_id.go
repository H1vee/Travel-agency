package api

import (
	"log"
	"net/http"
	"tour-server/tour/dto"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// GetToursCarouselByID returns an Echo handler function that retrieves gallery images
// for a specific tour by its ID
func GetToursCarouselByID(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Create a slice to hold multiple carousel images
		var tour []dto.TourCarousel

		// Extract the tour ID from the URL parameter
		id := c.Param("id")

		// Check if database connection is valid
		if db == nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Database connection is nil"})
		}

		// Query the database for all gallery images associated with the specified tour
		err := db.Table("tour_gallery_images").Debug().
			Select(`tour_gallery_images.*`).
			Where("tour_gallery_images.tour_id = ?", id).
			Find(&tour).Error

		// Handle database errors
		if err != nil {
			log.Printf("Failed to fetch tour carousel: %v\n", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch tour carousel"})
		}

		// Return the gallery images as JSON with HTTP 200 OK status
		return c.JSON(http.StatusOK, tour)
	}
}
