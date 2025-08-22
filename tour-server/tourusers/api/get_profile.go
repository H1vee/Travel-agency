package api

import (
	"net/http"
	"tour-server/tourusers/dto"
	"tour-server/tourusers/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func GetProfile(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		userID := c.Get("user_id").(uint)

		var user models.TourUser
		if err := db.First(&user, userID).Error; err != nil {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "User not found",
			})
		}
		response := dto.UserResponse{
			ID:         user.ID,
			Email:      user.Email,
			Name:       user.Name,
			Phone:      user.Phone,
			AvatarURL:  user.AvatarURL,
			Role:       user.Role,
			IsVerified: user.IsVerified,
		}
		return c.JSON(http.StatusOK, response)
	}
}
