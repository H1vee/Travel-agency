package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
	"tour-server/liqpay"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// POST /liqpay/confirm
// Фронтенд викликає після успіху у віджеті, передаючи лише order_id.
// Сервер сам звертається до LiqPay status API, щоб перевірити стан платежу,
// бо подія liqpay.callback у віджеті не повертає підписаних data+signature.
func ConfirmPayment(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req struct {
			OrderID string `json:"order_id"`
		}
		if err := c.Bind(&req); err != nil || req.OrderID == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "order_id required",
			})
		}

		publicKey := os.Getenv("LIQPAY_PUBLIC_KEY")
		privateKey := os.Getenv("LIQPAY_PRIVATE_KEY")

		statusParams := liqpay.Params{
			"public_key": publicKey,
			"version":    "3",
			"action":     "status",
			"order_id":   req.OrderID,
		}
		data, err := liqpay.Encode(statusParams)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "encode failed"})
		}
		signature := liqpay.Sign(data, privateKey)

		form := url.Values{}
		form.Set("data", data)
		form.Set("signature", signature)

		httpClient := &http.Client{Timeout: 10 * time.Second}
		resp, err := httpClient.Post(
			"https://www.liqpay.ua/api/request",
			"application/x-www-form-urlencoded",
			strings.NewReader(form.Encode()),
		)
		if err != nil {
			return c.JSON(http.StatusBadGateway, map[string]string{"error": "liqpay unreachable"})
		}
		defer resp.Body.Close()

		body, _ := io.ReadAll(resp.Body)
		var payload map[string]interface{}
		if err := json.Unmarshal(body, &payload); err != nil {
			return c.JSON(http.StatusBadGateway, map[string]string{"error": "bad liqpay response"})
		}

		status, _ := payload["status"].(string)
		paymentID := ""
		if pid, ok := payload["payment_id"].(float64); ok {
			paymentID = fmt.Sprintf("%.0f", pid)
		}

		if status != "success" && status != "sandbox" {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": fmt.Sprintf("payment status is '%s', not successful", status),
			})
		}

		transitioned, err := confirmBookingByOrder(db, req.OrderID, paymentID)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		// Send the confirmation email from whichever path (this call or the
		// LiqPay server callback) first flips the booking to paid — the guest
		// gets exactly one email even if the callback never reaches us.
		if transitioned {
			sendPaymentEmail(db, req.OrderID)
		}

		return c.JSON(http.StatusOK, map[string]interface{}{
			"message": "Бронювання підтверджено",
			"status":  "confirmed",
		})
	}
}

// confirmBookingByOrder flips the booking to confirmed/paid. The bool result
// reports whether this call performed the transition (false if the booking was
// already paid) so the caller can send the confirmation email exactly once.
func confirmBookingByOrder(db *gorm.DB, orderID, paymentID string) (bool, error) {
	tx := db.Begin()
	if tx.Error != nil {
		return false, tx.Error
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
		return false, fmt.Errorf("booking not found for order %s", orderID)
	}

	if booking.PaymentStatus == "paid" {
		tx.Rollback()
		return false, nil
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
		return false, err
	}

	if err := tx.Commit().Error; err != nil {
		return false, err
	}
	return true, nil
}
