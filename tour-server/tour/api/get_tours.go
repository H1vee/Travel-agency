package api

import (
	"fmt"
	"net/http"
	"tour-server/database"
	"tour-server/tour/models"

	"github.com/labstack/echo/v4"
)

func GetToursForCards(c echo.Context) error {
	var tours []models.Tour

	// Запит до бази даних
	if err := database.DB.Model(&models.Tour{}).Select("id, title, description, call_to_action, price, rating, image_src").
		Find(&tours).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Could not fetch tours"})
	}
	for _, tour := range tours {
		fmt.Println(tour)
	}
	// Повернення результату
	return c.JSON(http.StatusOK, tours)
}
