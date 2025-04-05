package api

import (
	"log"
	"net/http"
	"tour-server/tour/dto"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// GetToursForCards returns an Echo handler function that retrieves basic card information
// for all tours in the database
func GetToursForCards(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Check if database connection is valid
		if db == nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Database connection is nil"})
		}

		// Query the database for all tours with their card images
		var toursWithImages []dto.TourCard
		err := db.Debug().Table("tours").
			Select("tours.id, tours.title, tours.price, COALESCE(tour_card_images.image_src, 'no-image.jpg') AS image_src").
			Joins("LEFT JOIN tour_card_images ON tours.id = tour_card_images.tour_id").
			Find(&toursWithImages).Error

		// Log the executed SQL query and results for debugging
		log.Printf("SQL Query executed: %+v\n", db.Statement.SQL.String())
		log.Printf("Result: %+v\n", toursWithImages)

		// Handle database errors
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch tours",
			})
		}

		// Return all tour cards as JSON with HTTP 200 OK status
		return c.JSON(http.StatusOK, toursWithImages)
	}
}
