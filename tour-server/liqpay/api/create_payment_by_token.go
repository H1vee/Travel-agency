package api

import (
	"fmt"
	"net/http"
	"os"
	"time"
	"tour-server/liqpay"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type CreatePaymentByTokenRequest struct {
	Token string `json:"token"`
}

// CreatePaymentByToken is the guest-facing counterpart of CreatePayment.
// It authenticates the caller via a one-time-ish payment token (sent in the
// booking-created email) instead of a JWT, so unauthenticated guests can
// resume payment without logging in.
func CreatePaymentByToken(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req CreatePaymentByTokenRequest
		if err := c.Bind(&req); err != nil || len(req.Token) != 64 {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Невірний токен"})
		}

		var booking struct {
			ID            uint       `gorm:"column:id"`
			TotalPrice    float64    `gorm:"column:total_price"`
			CustomerName  string     `gorm:"column:customer_name"`
			PaymentStatus string     `gorm:"column:payment_status"`
			Status        string     `gorm:"column:status"`
			ExpiresAt     *time.Time `gorm:"column:payment_token_expires_at"`
			TourTitle     string     `gorm:"column:tour_title"`
		}

		err := db.Raw(`
			SELECT b.id, b.total_price, b.customer_name,
				COALESCE(b.payment_status, 'pending') AS payment_status,
				b.status, b.payment_token_expires_at,
				t.title AS tour_title
			FROM bookings b
			JOIN tour_dates td ON b.tour_date_id = td.id
			JOIN tours t ON td.tour_id = t.id
			WHERE b.payment_token = ?
		`, req.Token).Scan(&booking).Error

		if err != nil || booking.ID == 0 {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Посилання недійсне"})
		}

		if booking.ExpiresAt != nil && time.Now().After(*booking.ExpiresAt) {
			return c.JSON(http.StatusGone, map[string]string{"error": "Термін дії посилання сплив"})
		}

		if booking.PaymentStatus == "paid" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Вже оплачено"})
		}

		if booking.Status == "cancelled" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Бронювання скасовано"})
		}

		orderID := fmt.Sprintf("booking-%d-%d", booking.ID, time.Now().Unix())
		db.Exec("UPDATE bookings SET liqpay_order_id = ? WHERE id = ?", orderID, booking.ID)

		publicKey := os.Getenv("LIQPAY_PUBLIC_KEY")
		privateKey := os.Getenv("LIQPAY_PRIVATE_KEY")
		callbackURL := os.Getenv("LIQPAY_CALLBACK_URL")

		params := liqpay.Params{
			"public_key":  publicKey,
			"version":     "3",
			"action":      "pay",
			"amount":      fmt.Sprintf("%.2f", booking.TotalPrice),
			"currency":    "UAH",
			"description": fmt.Sprintf("Тур: %s — %s", booking.TourTitle, booking.CustomerName),
			"order_id":    orderID,
			"server_url":  callbackURL,
			"sandbox":     "1",
		}

		data, err := liqpay.Encode(params)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to encode payment"})
		}

		signature := liqpay.Sign(data, privateKey)

		return c.JSON(http.StatusOK, map[string]interface{}{
			"data":       data,
			"signature":  signature,
			"order_id":   orderID,
			"booking_id": booking.ID,
			"amount":     booking.TotalPrice,
		})
	}
}
