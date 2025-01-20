package api

import (
	"net/http"
	"tour-server/tour/dto"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func GetToursForSwiper(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		if db == nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Database connection is nil"})
		}
		var TourSwiper []dto.TourSwiper

		err := db.Debug().Table("tours").
			Select("tours.id, tours.title, tours.description, tours.call_to_action, COALESCE(tour_card_images.image_src, 'no-image.jpg') AS image_src").
			Joins("LEFT JOIN tour_card_images ON tours.id = tour_card_images.tour_id").
			Find(&TourSwiper).Error

		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch tours",
			})
		}
		return c.JSON(http.StatusOK, TourSwiper)
	}
}
