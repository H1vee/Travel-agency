package api

import (
	"log"
	"net/http"
	"tour-server/userfavorites/dto"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func GetUserFavorites(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {

		userID := c.Get("user_id").(uint)

		var favorites []dto.UserFavoriteResponse
		err := db.Table("tour_user_favorites").
			Select("user_favorites.tour_id, tours.title").
			Joins("JOIN tours ON user_favorites.tour_id = tours.id").
			Where("user_favorites.user_id = ?", userID).
			Scan(&favorites).Error

		if err != nil {
			log.Printf("Failed to fetch user favorites: %v\n", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch favorites",
			})
		}
		return c.JSON(http.StatusOK, favorites)
	}
}
