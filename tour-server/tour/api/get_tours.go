package api

import (
	"net/http"
	"tour-server/database"
	"tour-server/tour/models"

	"github.com/labstack/echo/v4"
)

func GetToursForCards(c echo.Context) error {
	var tours []struct {
		ID           uint    `json:"id"`
		Title        string  `json:"title"`
		Description  string  `json:"description"`
		CallToAction string  `json:"call_to_action"`
		Price        float64 `json:"price"`
		ImageSrc     string  `json:"imageSrc"`
	}

	if err := database.DB.Model(&models.Tour{}).Select("id, title, description, call_to_action, price, image_src").Find(&tours).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Could not fetch tours"})
	}

	return c.JSON(http.StatusOK, tours)
}
