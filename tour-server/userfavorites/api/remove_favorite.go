package api

import (
	"log"
	"net/http"
	"tour-server/userfavorites/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func RemoveFavorite(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		tourID := c.Param("tour_id")
		userID := c.Get("user_id").(uint)

		result := db.Where("user_id = ? AND tour_id = ?", userID, tourID).
			Delete(&models.UserFavorite{})

		if result.Error != nil {
			log.Printf("Failed to remove favorite: %v\n", result.Error)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to remove favorite",
			})
		}

		if result.RowsAffected == 0 {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "Favorite not found",
			})
		}

		return c.JSON(http.StatusOK, map[string]string{
			"message": "Tour removed from favorites",
		})
	}
}
