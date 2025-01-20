package api

import (
	"log"
	"net/http"
	"tour-server/tourcardimage/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func GetTourCardImages(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		if db == nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Database connection is nil"})
		}
		var TourImage []models.TourCardImage

		err := db.Debug().Table("tour_card_images").Select("*").Find(&TourImage).Error
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch tours",
			})
		}
		for _, tour := range TourImage {
			log.Printf("Fetched tour: %+v", tour)
		}
		return c.JSON(http.StatusOK, TourImage)
	}
}
