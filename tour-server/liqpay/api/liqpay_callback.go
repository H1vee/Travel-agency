package api

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
	"tour-server/email"
	"tour-server/liqpay"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func LiqPayCallback(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		data := c.FormValue("data")
		signature := c.FormValue("signature")

		if data == "" || signature == "" {
			log.Println("LiqPay callback: missing data or signature")
			return c.String(http.StatusBadRequest, "missing fields")
		}

		privateKey := os.Getenv("LIQPAY_PRIVATE_KEY")

		if !liqpay.Verify(data, signature, privateKey) {
			log.Println("LiqPay callback: invalid signature")
			return c.String(http.StatusForbidden, "invalid signature")
		}

		payload, err := liqpay.Decode(data)
		if err != nil {
			log.Printf("LiqPay callback decode error: %v", err)
			return c.String(http.StatusBadRequest, "decode error")
		}

		orderID, _ := payload["order_id"].(string)
		status, _ := payload["status"].(string)
		paymentID, _ := payload["payment_id"].(string)
		if paymentID == "" {
			if pid, ok := payload["payment_id"].(float64); ok {
				paymentID = fmt.Sprintf("%.0f", pid)
			}
		}

		log.Printf("LiqPay callback: order=%s status=%s payment_id=%s", orderID, status, paymentID)

		if orderID == "" {
			return c.String(http.StatusBadRequest, "missing order_id")
		}

		switch status {
		case "success", "sandbox":
			transitioned, err := confirmBooking(db, orderID, paymentID)
			if err != nil {
				log.Printf("LiqPay callback: confirmBooking error: %v", err)
			} else if transitioned {
				log.Printf("Booking auto-confirmed: order=%s", orderID)
				sendPaymentEmail(db, orderID)
			}

		case "failure", "error":
			db.Exec(
				"UPDATE bookings SET payment_status = 'failed' WHERE liqpay_order_id = ?",
				orderID,
			)
			log.Printf("Payment failed: order=%s", orderID)

		case "reversed":
			if err := cancelBookingByOrder(db, orderID); err != nil {
				log.Printf("LiqPay callback: cancelBooking error: %v", err)
			} else {
				log.Printf("Booking cancelled (reversed): order=%s", orderID)
				// Send cancellation email for reversed payment
				sendReversalEmail(db, orderID)
			}

		default:
			log.Printf("LiqPay callback: unhandled status=%s order=%s", status, orderID)
		}

		return c.String(http.StatusOK, "ok")
	}
}

// confirmBooking sets status=confirmed, payment_status=paid.
// Seats are already reserved (decremented by trigger on INSERT),
// so no seat adjustment needed for pending→confirmed.
// The bool result reports whether this call performed the transition
// (false if the booking was already paid) so the email is sent once.
func confirmBooking(db *gorm.DB, orderID, paymentID string) (bool, error) {
	tx := db.Begin()
	if tx.Error != nil {
		return false, tx.Error
	}

	var booking struct {
		ID            uint   `gorm:"column:id"`
		Status        string `gorm:"column:status"`
		PaymentStatus string `gorm:"column:payment_status"`
	}
	if err := tx.Raw(
		"SELECT id, status, payment_status FROM bookings WHERE liqpay_order_id = ?",
		orderID,
	).Scan(&booking).Error; err != nil || booking.ID == 0 {
		tx.Rollback()
		return false, fmt.Errorf("booking not found for order %s", orderID)
	}

	// Idempotency — already confirmed, skip
	if booking.PaymentStatus == "paid" {
		tx.Rollback()
		log.Printf("Booking already paid: order=%s", orderID)
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

// cancelBookingByOrder handles payment reversal:
// restores seats and sets status=cancelled, payment_status=reversed.
func cancelBookingByOrder(db *gorm.DB, orderID string) error {
	tx := db.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	var booking struct {
		ID         uint   `gorm:"column:id"`
		TourDateID uint   `gorm:"column:tour_date_id"`
		Seats      uint   `gorm:"column:seats"`
		Status     string `gorm:"column:status"`
	}
	if err := tx.Raw(
		"SELECT id, tour_date_id, seats, status FROM bookings WHERE liqpay_order_id = ?",
		orderID,
	).Scan(&booking).Error; err != nil || booking.ID == 0 {
		tx.Rollback()
		return fmt.Errorf("booking not found for order %s", orderID)
	}

	// Only restore seats if booking was active
	if booking.Status == "pending" || booking.Status == "confirmed" {
		if err := tx.Exec(
			"UPDATE tour_seats SET available_seats = available_seats + ? WHERE tour_date_id = ?",
			booking.Seats, booking.TourDateID,
		).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	if err := tx.Exec(`
		UPDATE bookings
		SET status = 'cancelled',
			payment_status = 'reversed'
		WHERE liqpay_order_id = ?
	`, orderID).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

// ── Email helpers ─────────────────────────────────────────────────────────────

func sendPaymentEmail(db *gorm.DB, orderID string) {
	var info struct {
		ID            uint    `gorm:"column:id"`
		CustomerName  string  `gorm:"column:customer_name"`
		CustomerEmail string  `gorm:"column:customer_email"`
		Seats         uint    `gorm:"column:seats"`
		TotalPrice    float64 `gorm:"column:total_price"`
		TourTitle     string  `gorm:"column:tour_title"`
	}

	err := db.Raw(`
		SELECT b.id, b.customer_name, b.customer_email, b.seats, b.total_price,
		       t.title AS tour_title
		FROM bookings b
		JOIN tour_dates td ON b.tour_date_id = td.id
		JOIN tours t ON td.tour_id = t.id
		WHERE b.liqpay_order_id = ?
	`, orderID).Scan(&info).Error

	if err != nil || info.ID == 0 || info.CustomerEmail == "" {
		return
	}

	email.NotifyPaymentReceived(info.CustomerEmail, email.BookingNotification{
		CustomerName: info.CustomerName,
		TourTitle:    info.TourTitle,
		Seats:        int(info.Seats),
		TotalPrice:   info.TotalPrice,
		BookingID:    info.ID,
		Status:       "paid",
	})
	log.Printf("Payment email queued: booking #%d → %s", info.ID, info.CustomerEmail)
}

func sendReversalEmail(db *gorm.DB, orderID string) {
	var info struct {
		ID            uint    `gorm:"column:id"`
		CustomerName  string  `gorm:"column:customer_name"`
		CustomerEmail string  `gorm:"column:customer_email"`
		Seats         uint    `gorm:"column:seats"`
		TotalPrice    float64 `gorm:"column:total_price"`
		TourTitle     string  `gorm:"column:tour_title"`
	}

	err := db.Raw(`
		SELECT b.id, b.customer_name, b.customer_email, b.seats, b.total_price,
		       t.title AS tour_title
		FROM bookings b
		JOIN tour_dates td ON b.tour_date_id = td.id
		JOIN tours t ON td.tour_id = t.id
		WHERE b.liqpay_order_id = ?
	`, orderID).Scan(&info).Error

	if err != nil || info.ID == 0 || info.CustomerEmail == "" {
		return
	}

	email.NotifyBookingCancelled(info.CustomerEmail, email.BookingNotification{
		CustomerName: info.CustomerName,
		TourTitle:    info.TourTitle,
		Seats:        int(info.Seats),
		TotalPrice:   info.TotalPrice,
		BookingID:    info.ID,
		Status:       "cancelled",
	})
	log.Printf("Reversal email queued: booking #%d → %s", info.ID, info.CustomerEmail)
}