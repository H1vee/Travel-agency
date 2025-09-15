// get_tours_carousel_by_id.go
package api

import (
	"log"
	"net/http"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// TourCarousel represents the response structure for carousel images
type TourCarousel struct {
	TourID   uint   `json:"tourID"`
	ImageSrc string `json:"image_src"`
}

// GetToursCarouselByID returns an Echo handler function that retrieves gallery images
// for a specific tour by its ID
func GetToursCarouselByID(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Extract the tour ID from the URL parameter
		id := c.Param("id")
		
		log.Printf("🔍 Fetching carousel for tour ID: %s", id)

		// Check if database connection is valid
		if db == nil {
			log.Printf("❌ Database connection is nil")
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Database connection is nil"})
		}

		var carousel []TourCarousel

		// Query the database for all gallery images associated with the specified tour
		err := db.Debug().Table("tour_gallery_images").
			Select("tour_id as tourID, image_src").
			Where("tour_id = ?", id).
			Find(&carousel).Error

		if err != nil {
			log.Printf("❌ Failed to fetch tour carousel: %v", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch tour carousel"})
		}

		log.Printf("✅ Found %d carousel images for tour ID %s", len(carousel), id)
		for i, img := range carousel {
			log.Printf("   Image %d: TourID=%d, ImageSrc=%s", i+1, img.TourID, img.ImageSrc)
		}

		// Return the gallery images as JSON with HTTP 200 OK status
		return c.JSON(http.StatusOK, carousel)
	}
}