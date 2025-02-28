package api

import (
	"log"
	"net/http"
	"tour-server/tour/dto"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func GetToursForCardsByID(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		ids := c.Param("id")
		if db == nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Database connection is nil"})
		}
		var toursWithImages []dto.TourCard
		err := db.Debug().Table("tours").
			Select("tours.id, tours.title, tours.price, COALESCE(tour_card_images.image_src, 'no-image.jpg') AS image_src").
			Joins("LEFT JOIN tour_card_images ON tours.id = tour_card_images.tour_id").
			Where("tours.id IN (" + ids + ")").
			Find(&toursWithImages).Error

		log.Printf("SQL Query executed: %+v\n", db.Statement.SQL.String())
		log.Printf("Result: %+v\n", toursWithImages)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch tours",
			})
		}
		return c.JSON(http.StatusOK, toursWithImages)
	}
}
