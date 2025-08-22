package api

import (
	"log"
	"net/http"
	"tour-server/tourusers/dto"
	"tour-server/tourusers/models"

	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func RegisterUser(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req dto.RegisterRequest

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

		var existingUser models.TourUser
		if err := db.Where("email = ?", req.Email).First(&existingUser).Error; err != nil {
			return c.JSON(http.StatusConflict, map[string]string{
				"error": "User with this email already exist",
			})
		}

		hashPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)

		if err != nil {
			log.Printf("Failed to hash password: %v\n", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to process password",
			})
		}

		user := models.TourUser{
			Email:        req.Email,
			PasswordHash: string(hashPassword),
			Name:         req.Name,
			Phone:        req.Phone,
			Role:         "user",
			IsVerified:   false,
		}

		if err := db.Create(&user).Error; err != nil {
			log.Printf("Failed to create user: %v\n", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to create user",
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

		return c.JSON(http.StatusCreated, response)
	}
}
