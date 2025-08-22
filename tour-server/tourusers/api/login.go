package api

import (
	"log"
	"net/http"
	"time"
	"tour-server/config"
	"tour-server/tourusers/dto"
	"tour-server/tourusers/models"

	"github.com/golang-jwt/jwt/v4"
	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type JWTClaims struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func LoginUser(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req dto.LoginRequest

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

		var user models.TourUser

		if err := db.Where("email = ?", req.Email).First(&user).Error; err != nil {
			return c.JSON(http.StatusUnauthorized, map[string]string{
				"error": "Invalid credentials",
			})
		}

		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
			return c.JSON(http.StatusUnauthorized, map[string]string{
				"error": "Invalid credentials",
			})
		}

		now := time.Now()
		user.LastLogin = &now
		db.Save(&user)

		cfg := config.GetConfig()

		claims := JWTClaims{
			UserID: user.ID,
			Email:  user.Email,
			Role:   user.Role,
			RegisteredClaims: jwt.RegisteredClaims{
				ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(cfg.JWT.ExpiryHour) * time.Hour)),
				IssuedAt:  jwt.NewNumericDate(time.Now()),
				NotBefore: jwt.NewNumericDate(time.Now()),
			},
		}

		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		tokenString, err := token.SignedString([]byte(cfg.JWT.Secret))
		if err != nil {
			log.Printf("Failed to generate token: %v\n", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to generate token",
			})
		}

		response := map[string]interface{}{
			"token": tokenString,
			"user": dto.UserResponse{
				ID:         user.ID,
				Email:      user.Email,
				Name:       user.Name,
				Phone:      user.Phone,
				AvatarURL:  user.AvatarURL,
				Role:       user.Role,
				IsVerified: user.IsVerified,
			},
		}
		return c.JSON(http.StatusOK, response)
	}
}
