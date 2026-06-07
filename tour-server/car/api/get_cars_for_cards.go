package api

import (
	"net/http"
	"tour-server/car/dto"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// GetCarsForCards returns active cars in the compact card form used on the home
// page and catalogue grid.
func GetCarsForCards(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		if db == nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Database connection is nil"})
		}

		var cars []dto.CarCard
		err := db.Table("cars").
			Select(`
				cars.id, cars.make, cars.model, cars.year, cars.price,
				cars.mileage, cars.fuel_type, cars.body_type,
				COALESCE(car_card_images.image_src, '/static/no-image.jpg') AS image_src
			`).
			Joins("LEFT JOIN car_card_images ON cars.id = car_card_images.car_id").
			Where("cars.status_id = (SELECT id FROM statuses WHERE name = 'active')").
			Order("cars.id DESC").
			Find(&cars).Error

		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to fetch cars"})
		}

		return c.JSON(http.StatusOK, cars)
	}
}

// GetCarsForSwiper returns the newest active cars for the home page carousel.
func GetCarsForSwiper(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var cars []dto.CarCard
		err := db.Table("cars").
			Select(`
				cars.id, cars.make, cars.model, cars.year, cars.price,
				cars.mileage, cars.fuel_type, cars.body_type,
				COALESCE(car_card_images.image_src, '/static/no-image.jpg') AS image_src
			`).
			Joins("LEFT JOIN car_card_images ON cars.id = car_card_images.car_id").
			Where("cars.status_id = (SELECT id FROM statuses WHERE name = 'active')").
			Order("cars.id DESC").
			Limit(10).
			Find(&cars).Error

		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to fetch cars"})
		}

		return c.JSON(http.StatusOK, cars)
	}
}
