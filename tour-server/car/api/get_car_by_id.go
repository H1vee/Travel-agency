package api

import (
	"log"
	"net/http"
	"tour-server/car/dto"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// GetCarByID returns the full detail of a single active car, including its
// status name and card image.
func GetCarByID(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		id := c.Param("id")

		var car dto.CarDetail
		err := db.Table("cars").
			Select(`
				cars.id, cars.make, cars.model, cars.year, cars.vin, cars.price,
				cars.mileage, cars.fuel_type, cars.engine, cars.engine_capacity,
				cars.battery_capacity, cars.transmission, cars.drive, cars.body_type,
				cars.color, cars.seats, cars.description, cars.status_id,
				statuses.name AS status,
				COALESCE(car_card_images.image_src, '/static/no-image.jpg') AS card_image
			`).
			Joins("JOIN statuses ON cars.status_id = statuses.id").
			Joins("LEFT JOIN car_card_images ON cars.id = car_card_images.car_id").
			Where("cars.id = ?", id).
			Scan(&car).Error

		if err != nil {
			log.Printf("Failed to fetch car: %v\n", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to fetch car"})
		}

		if car.ID == 0 {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Car not found"})
		}

		return c.JSON(http.StatusOK, car)
	}
}

// GetCarCarousel returns the gallery (carousel) images for a car, falling back
// to the card image when no gallery images exist.
func GetCarCarousel(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		id := c.Param("id")

		var images []dto.GalleryImage
		err := db.Table("car_gallery_images").
			Select("id, image_src").
			Where("car_id = ?", id).
			Order("position ASC, id ASC").
			Find(&images).Error

		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to fetch images"})
		}

		if len(images) == 0 {
			var card dto.GalleryImage
			db.Table("car_card_images").Select("id, image_src").Where("car_id = ?", id).Scan(&card)
			if card.ImageSrc != "" {
				images = append(images, card)
			}
		}

		return c.JSON(http.StatusOK, images)
	}
}
