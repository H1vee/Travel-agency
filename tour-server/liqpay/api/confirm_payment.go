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

// POST /liqpay/confirm
// Фронтенд викликає після успішної оплати з data+signature від LiqPay віджету
// Верифікуємо підпис і підтверджуємо бронювання
func ConfirmPayment(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req struct {
			Data      string `json:"data"`
			Signature string `json:"signature"`
		}
		if err := c.Bind(&req); err != nil || req.Data == "" || req.Signature == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "data and signature required",
			})
		}

		privateKey := os.Getenv("LIQPAY_PRIVATE_KEY")

		// Верифікуємо підпис — якщо підпис неправильний, відхиляємо
		if !liqpay.Verify(req.Data, req.Signature, privateKey) {
			return c.JSON(http.StatusForbidden, map[string]string{
				"error": "invalid signature",
			})
		}

		// Декодуємо payload
		payload, err := liqpay.Decode(req.Data)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "decode error",
			})
		}

		orderID, _ := payload["order_id"].(string)
		status, _ := payload["status"].(string)
		paymentID := ""
		if pid, ok := payload["payment_id"].(float64); ok {
			paymentID = fmt.Sprintf("%.0f", pid)
		}

		if orderID == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "missing order_id",
			})
		}

		// Тільки success і sandbox вважаються успішною оплатою
		if status != "success" && status != "sandbox" {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": fmt.Sprintf("payment status is '%s', not successful", status),
			})
		}

		// Підтверджуємо бронювання
		if err := confirmBookingByOrder(db, orderID, paymentID); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": err.Error(),
			})
		}

		return c.JSON(http.StatusOK, map[string]interface{}{
			"message": "Бронювання підтверджено",
			"status":  "confirmed",
		})
	}
}

func confirmBookingByOrder(db *gorm.DB, orderID, paymentID string) error {
	tx := db.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	var booking struct {
		ID            uint   `gorm:"column:id"`
		PaymentStatus string `gorm:"column:payment_status"`
	}
	if err := tx.Raw(
		"SELECT id, payment_status FROM bookings WHERE liqpay_order_id = ?",
		orderID,
	).Scan(&booking).Error; err != nil || booking.ID == 0 {
		tx.Rollback()
		return fmt.Errorf("booking not found for order %s", orderID)
	}

	// Ідемпотентність
	if booking.PaymentStatus == "paid" {
		tx.Rollback()
		return nil
	}

	now := time.Now()
	if err := tx.Exec(`
		UPDATE bookings
		SET status = 'confirmed',
			payment_status = 'paid',
			liqpay_payment_id = ?,
			paid_at = ?
		WHERE liqpay_order_id = ?
	`, paymentID, now, orderID).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}
