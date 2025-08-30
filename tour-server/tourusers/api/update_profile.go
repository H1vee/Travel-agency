package api

import (
	"net/http"
	"strings"
	"tour-server/tourusers/dto"
	"tour-server/tourusers/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func UpdateProfile(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		userID := c.Get("user_id").(uint)

		var req dto.UpdateProfileRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Invalid request format",
			})
		}

		// Валидация
		if strings.TrimSpace(req.Name) == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Name is required",
			})
		}

		var user models.TourUser
		if err := db.First(&user, userID).Error; err != nil {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "User not found",
			})
		}

		user.Name = strings.TrimSpace(req.Name)
		if req.Phone != nil {
			user.Phone = strings.TrimSpace(*req.Phone)
		}
		if req.AvatarURL != nil {
			user.AvatarURL = strings.TrimSpace(*req.AvatarURL)
		}

		if err := db.Save(&user).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to update profile",
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
