package api

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
	"tour-server/email"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

// POST /auth/forgot-password
// Generates a reset token and sends it via email.
// Always returns 200 even if email not found (prevents email enumeration).
func ForgotPassword(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req ForgotPasswordRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Невірний формат запиту",
			})
		}

		if req.Email == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Email обов'язковий",
			})
		}

		// Always return success to prevent email enumeration
		successResponse := map[string]string{
			"message": "Якщо цей email зареєстрований, ви отримаєте лист з інструкціями",
		}

		// Find user
		var user struct {
			ID   uint   `gorm:"column:id"`
			Name string `gorm:"column:name"`
		}
		err := db.Raw("SELECT id, name FROM tour_users WHERE email = ?", req.Email).Scan(&user).Error
		if err != nil || user.ID == 0 {
			// User not found — return success anyway (security)
			return c.JSON(http.StatusOK, successResponse)
		}

		// Invalidate any existing unused tokens for this user
		db.Exec("UPDATE password_reset_tokens SET used = TRUE WHERE user_id = ? AND used = FALSE", user.ID)

		// Generate secure random token
		tokenBytes := make([]byte, 32)
		if _, err := rand.Read(tokenBytes); err != nil {
			log.Printf("Failed to generate reset token: %v", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Помилка сервера",
			})
		}
		token := hex.EncodeToString(tokenBytes)

		// Token expires in 1 hour
		expiresAt := time.Now().Add(1 * time.Hour)

		// Save token to DB
		err = db.Exec(
			"INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
			user.ID, token, expiresAt,
		).Error
		if err != nil {
			log.Printf("Failed to save reset token: %v", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Помилка сервера",
			})
		}

		// Build reset URL
		frontendURL := os.Getenv("FRONTEND_URL")
		if frontendURL == "" {
			frontendURL = "https://openworld.local"
		}
		resetURL := fmt.Sprintf("%s/reset-password?token=%s", frontendURL, token)

		// Send email async
		go sendResetEmail(req.Email, user.Name, resetURL, token)

		log.Printf("Password reset requested: user_id=%d email=%s", user.ID, req.Email)
		return c.JSON(http.StatusOK, successResponse)
	}
}

func sendResetEmail(toEmail, userName, resetURL, token string) {
	subject := "🔐 Скидання пароля — OpenWorld"

	body := fmt.Sprintf(`<!DOCTYPE html>
<html lang="uk">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

<tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
  <div style="font-size:36px;margin-bottom:8px;">🔐</div>
  <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0;">Скидання пароля</h1>
</td></tr>

<tr><td style="padding:32px 40px;">
  <p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 24px;">
    Привіт, <strong>%s</strong>! Ми отримали запит на скидання пароля для вашого акаунту OpenWorld.
  </p>

  <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
    Натисніть кнопку нижче, щоб встановити новий пароль. Посилання дійсне <strong>1 годину</strong>.
  </p>

  <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
  <tr><td align="center">
    <a href="%s" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;padding:14px 32px;border-radius:12px;font-size:16px;font-weight:700;text-decoration:none;box-shadow:0 4px 14px rgba(99,102,241,0.35);">
      Скинути пароль
    </a>
  </td></tr>
  </table>

  <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0 0 16px;">
    Якщо кнопка не працює, скопіюйте це посилання у браузер:<br>
    <a href="%s" style="color:#6366f1;word-break:break-all;">%s</a>
  </p>

  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;">
  <tr><td style="padding:14px 18px;">
    <p style="color:#92400e;font-size:13px;font-weight:600;margin:0;">
      ⚠️ Якщо ви не запитували скидання пароля — просто проігноруйте цей лист. Ваш акаунт у безпеці.
    </p>
  </td></tr>
  </table>
</td></tr>

<tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
  <p style="color:#94a3b8;font-size:13px;margin:0 0 4px;">© 2026 OpenWorld — Ваш провідник у світ подорожей</p>
  <p style="color:#94a3b8;font-size:12px;margin:0;">Цей лист відправлено автоматично.</p>
</td></tr>

</table></td></tr></table></body></html>`, userName, resetURL, resetURL, resetURL)

	if err := email.Send(toEmail, subject, body); err != nil {
		log.Printf("Failed to send reset email to %s: %v", toEmail, err)
	} else {
		log.Printf("Reset email sent to %s", toEmail)
	}
}
