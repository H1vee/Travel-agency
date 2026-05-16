package api

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type bookingByTokenResponse struct {
	ID            uint      `json:"id"`
	TourTitle     string    `json:"tour_title"`
	CustomerName  string    `json:"customer_name"`
	Seats         uint      `json:"seats"`
	TotalPrice    float64   `json:"total_price"`
	Status        string    `json:"status"`
	PaymentStatus string    `json:"payment_status"`
	DateFrom      time.Time `json:"date_from"`
	DateTo        time.Time `json:"date_to"`
	FromLocation  string    `json:"from_location,omitempty"`
	ToLocation    string    `json:"to_location,omitempty"`
}

// GetBookingByToken returns the minimal booking info needed for the
// guest "pay later" magic-link page. Public endpoint — auth is the
// token itself (random 64-char hex with a 7-day expiry).
func GetBookingByToken(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		token := c.Param("token")
		if len(token) != 64 {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Посилання недійсне"})
		}

		var row struct {
			ID            uint       `gorm:"column:id"`
			CustomerName  string     `gorm:"column:customer_name"`
			Seats         uint       `gorm:"column:seats"`
			TotalPrice    float64    `gorm:"column:total_price"`
			Status        string     `gorm:"column:status"`
			PaymentStatus string     `gorm:"column:payment_status"`
			ExpiresAt     *time.Time `gorm:"column:payment_token_expires_at"`
			TourTitle     string     `gorm:"column:tour_title"`
			DateFrom      time.Time  `gorm:"column:date_from"`
			DateTo        time.Time  `gorm:"column:date_to"`
			FromLocation  string     `gorm:"column:from_location"`
			ToLocation    string     `gorm:"column:to_location"`
		}

		err := db.Raw(`
			SELECT b.id, b.customer_name, b.seats, b.total_price,
				b.status, COALESCE(b.payment_status, 'pending') AS payment_status,
				b.payment_token_expires_at,
				t.title AS tour_title,
				td.date_from, td.date_to,
				COALESCE(fl.name, '') AS from_location,
				COALESCE(tl.name, '') AS to_location
			FROM bookings b
			JOIN tour_dates td ON b.tour_date_id = td.id
			JOIN tours t ON td.tour_id = t.id
			LEFT JOIN locations fl ON td.from_location_id = fl.id
			LEFT JOIN locations tl ON td.to_location_id = tl.id
			WHERE b.payment_token = ?
		`, token).Scan(&row).Error

		if err != nil || row.ID == 0 {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Посилання недійсне"})
		}

		if row.ExpiresAt != nil && time.Now().After(*row.ExpiresAt) {
			return c.JSON(http.StatusGone, map[string]string{"error": "Термін дії посилання сплив"})
		}

		return c.JSON(http.StatusOK, bookingByTokenResponse{
			ID:            row.ID,
			TourTitle:     row.TourTitle,
			CustomerName:  row.CustomerName,
			Seats:         row.Seats,
			TotalPrice:    row.TotalPrice,
			Status:        row.Status,
			PaymentStatus: row.PaymentStatus,
			DateFrom:      row.DateFrom,
			DateTo:        row.DateTo,
			FromLocation:  row.FromLocation,
			ToLocation:    row.ToLocation,
		})
	}
}
