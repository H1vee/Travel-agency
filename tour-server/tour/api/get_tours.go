package api

import (
	"net/http"
	"tour-server/tour/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func GetTours(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		if db == nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Database connection is nil"})
		}
		var toursWithImages []models.Tour
		err := db.Table("tours").
			Select("*").
			Find(&toursWithImages).Error

		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch tours",
			})
		}

		return c.JSON(http.StatusOK, toursWithImages)
	}
}
