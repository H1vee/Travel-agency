package api

import (
	"log"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type ResetPasswordRequest struct {
	Token       string `json:"token" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=6"`
}

// POST /auth/reset-password
// Validates the reset token and sets a new password.
func ResetPassword(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req ResetPasswordRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Невірний формат запиту",
			})
		}

		if req.Token == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Токен обов'язковий",
			})
		}

		if len(req.NewPassword) < 6 {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Пароль має містити мінімум 6 символів",
			})
		}

		// Find token
		var tokenRecord struct {
			ID        uint      `gorm:"column:id"`
			UserID    uint      `gorm:"column:user_id"`
			ExpiresAt time.Time `gorm:"column:expires_at"`
			Used      bool      `gorm:"column:used"`
		}

		err := db.Raw(
			"SELECT id, user_id, expires_at, used FROM password_reset_tokens WHERE token = ?",
			req.Token,
		).Scan(&tokenRecord).Error

		if err != nil || tokenRecord.ID == 0 {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Невірне або прострочене посилання",
			})
		}

		// Check if already used
		if tokenRecord.Used {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Це посилання вже було використане",
			})
		}

		// Check expiry
		if time.Now().After(tokenRecord.ExpiresAt) {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Посилання прострочене. Запросіть нове скидання пароля",
			})
		}

		// Hash new password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("Failed to hash password: %v", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Помилка сервера",
			})
		}

		// Start transaction
		tx := db.Begin()

		// Update password
		if err := tx.Exec(
			"UPDATE tour_users SET password_hash = ?, updated_at = NOW() WHERE id = ?",
			string(hashedPassword), tokenRecord.UserID,
		).Error; err != nil {
			tx.Rollback()
			log.Printf("Failed to update password: %v", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Не вдалося оновити пароль",
			})
		}

		// Mark token as used
		if err := tx.Exec(
			"UPDATE password_reset_tokens SET used = TRUE WHERE id = ?",
			tokenRecord.ID,
		).Error; err != nil {
			tx.Rollback()
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Помилка сервера",
			})
		}

		// Invalidate all other tokens for this user
		tx.Exec(
			"UPDATE password_reset_tokens SET used = TRUE WHERE user_id = ? AND id != ?",
			tokenRecord.UserID, tokenRecord.ID,
		)

		if err := tx.Commit().Error; err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Помилка сервера",
			})
		}

		log.Printf("Password reset successful: user_id=%d", tokenRecord.UserID)

		return c.JSON(http.StatusOK, map[string]string{
			"message": "Пароль успішно змінено. Тепер ви можете увійти з новим паролем.",
		})
	}
}

// GET /auth/verify-reset-token?token=xxx
// Checks if a reset token is valid (used by frontend before showing the form).
func VerifyResetToken(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		token := c.QueryParam("token")
		if token == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Токен обов'язковий",
			})
		}

		var tokenRecord struct {
			ID        uint      `gorm:"column:id"`
			ExpiresAt time.Time `gorm:"column:expires_at"`
			Used      bool      `gorm:"column:used"`
		}

		err := db.Raw(
			"SELECT id, expires_at, used FROM password_reset_tokens WHERE token = ?",
			token,
		).Scan(&tokenRecord).Error

		if err != nil || tokenRecord.ID == 0 {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"valid": "false",
				"error": "Посилання невірне",
			})
		}

		if tokenRecord.Used {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"valid": "false",
				"error": "Посилання вже використане",
			})
		}

		if time.Now().After(tokenRecord.ExpiresAt) {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"valid": "false",
				"error": "Посилання прострочене",
			})
		}

		return c.JSON(http.StatusOK, map[string]string{
			"valid":   "true",
			"message": "Токен дійсний",
		})
	}
}
