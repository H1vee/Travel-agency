package api

import (
	"log"
	"net/http"
	"tour-server/tour/dto"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func GetToursCarouselByID(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var tour []dto.TourCarousel
		id := c.Param("id")
		if db == nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Database connection is nil"})
		}
		err := db.Table("tour_gallery_images").Debug().
			Select(`tour_gallery_images.*`).
			Where("tour_gallery_images.tour_id = ?", id).
			Find(&tour).Error

		if err != nil {
			log.Printf("Failed to fetch tour carousel: %v\n", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch tour carousel"})
		}

		return c.JSON(http.StatusOK, tour)
	}

}
