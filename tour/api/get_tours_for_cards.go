package api

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type TourCardResponse struct {
	ID       uint    `json:"id"`
	Title    string  `json:"title"`
	Price    float64 `json:"price"`
	Rating   float64 `json:"rating"`
	ImageSrc *string `json:"imageSrc"`
}

func GetToursForCards(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		if db == nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Database connection is nil"})
		}

		var tours []TourCardResponse
		err := db.Table("tours").
			Select(`
				tours.id,
				tours.title,
				tours.price,
				tours.rating,
				COALESCE(tour_card_images.image_src, 'no-image.jpg') AS image_src
			`).
			Joins("LEFT JOIN tour_card_images ON tours.id = tour_card_images.tour_id").
			Where("tours.status_id = (SELECT id FROM statuses WHERE name = 'active')").
			Order("tours.id ASC").
			Find(&tours).Error

		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to fetch tours"})
		}

		return c.JSON(http.StatusOK, tours)
	}
}
