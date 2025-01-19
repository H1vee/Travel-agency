package api

import (
	"net/http"
	"tour-server/tour/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func GetToursForCards(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		if db == nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Database connection is nil"})
		}
		var toursWithImages []models.Tour
		err := db.Table("tours").
			Select("tours.id, tours.description, tours.price, tour_card_images.image_src AS imageSrc").
			Joins("LEFT JOIN tour_card_images ON tours.id = tour_card_images.tour_id").
			Find(&toursWithImages).Error

		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch tours",
			})
		}

		// Повернення результату у вигляді JSON
		return c.JSON(http.StatusOK, toursWithImages)
	}
}
