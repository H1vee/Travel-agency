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

type CreatePaymentRequest struct {
	BookingID uint `json:"booking_id"`
}

func CreatePayment(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req CreatePaymentRequest
		if err := c.Bind(&req); err != nil || req.BookingID == 0 {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "booking_id required"})
		}

		// Load booking
		var booking struct {
			ID            uint    `gorm:"column:id"`
			TotalPrice    float64 `gorm:"column:total_price"`
			CustomerEmail string  `gorm:"column:customer_email"`
			CustomerName  string  `gorm:"column:customer_name"`
			Status        string  `gorm:"column:status"`
			PaymentStatus string  `gorm:"column:payment_status"`
			TourTitle     string  `gorm:"column:tour_title"`
		}

		err := db.Raw(`
			SELECT b.id, b.total_price, b.customer_email, b.customer_name,
				b.status, b.payment_status,
				t.title AS tour_title
			FROM bookings b
			JOIN tour_dates td ON b.tour_date_id = td.id
			JOIN tours t ON td.tour_id = t.id
			WHERE b.id = ?
		`, req.BookingID).Scan(&booking).Error

		if err != nil || booking.ID == 0 {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Бронювання не знайдено"})
		}

		if booking.PaymentStatus == "paid" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Вже оплачено"})
		}

		// Unique order ID per payment attempt
		orderID := fmt.Sprintf("booking-%d-%d", booking.ID, time.Now().Unix())

		// Save order_id to booking for callback matching
		db.Exec("UPDATE bookings SET liqpay_order_id = ? WHERE id = ?", orderID, booking.ID)

		publicKey := os.Getenv("LIQPAY_PUBLIC_KEY")
		privateKey := os.Getenv("LIQPAY_PRIVATE_KEY")
		callbackURL := os.Getenv("LIQPAY_CALLBACK_URL") // e.g. https://yourdomain.com/liqpay/callback

		params := liqpay.Params{
			"public_key":  publicKey,
			"version":     "3",
			"action":      "pay",
			"amount":      fmt.Sprintf("%.2f", booking.TotalPrice),
			"currency":    "UAH",
			"description": fmt.Sprintf("Тур: %s — %s", booking.TourTitle, booking.CustomerName),
			"order_id":    orderID,
			"server_url":  callbackURL,
			// sandbox mode — remove or set to "" for production
			"sandbox": "1",
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