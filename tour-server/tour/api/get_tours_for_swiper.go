package api

import (
	"net/http"
	"tour-server/tour/dto"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// GetToursForSwiper returns an Echo handler function that retrieves tour information
// formatted specifically for display in a swiper/carousel component
func GetToursForSwiper(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Check if database connection is valid
		if db == nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Database connection is nil"})
		}

		// Query the database for all tours with relevant swiper display information
		var TourSwiper []dto.TourSwiper
		err := db.Debug().Table("tours").
			Select("tours.id, tours.title, tours.description, tours.call_to_action, COALESCE(tour_card_images.image_src, 'no-image.jpg') AS image_src").
			Joins("LEFT JOIN tour_card_images ON tours.id = tour_card_images.tour_id").
			Find(&TourSwiper).Error

		// Handle database errors
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch tours",
			})
		}

		// Return the tour swiper information as JSON with HTTP 200 OK status
		return c.JSON(http.StatusOK, TourSwiper)
	}
}
