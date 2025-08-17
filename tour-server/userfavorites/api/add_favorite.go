package api

import (
	"log"
	"net/http"
	"tour-server/userfavorites/dto"
	"tour-server/userfavorites/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func AddFavorite(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req dto.UserFavoriteCreateRequest

		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Invalid request format",
			})
		}

		if err := c.Validate(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Validation failed",
			})
		}

		userID := c.Get("user_id").(uint)

		favorite := models.UserFavorite{
			UserID: userID,
			TourID: req.TourID,
		}

		if err := db.Create(&favorite).Error; err != nil {
			log.Printf("Failed to add favorite: %v\n", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to add favorite",
			})
		}

		return c.JSON(http.StatusCreated, map[string]string{
			"message": "Tour added to favorites",
		})
	}
}
