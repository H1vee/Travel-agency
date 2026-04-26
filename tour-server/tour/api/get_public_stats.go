package api

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type PublicStats struct {
	TotalTours      int64   `json:"total_tours"`
	TotalBookings   int64   `json:"total_bookings"`
	TotalUsers      int64   `json:"total_users"`
	AverageRating   float64 `json:"average_rating"`
}

// GET /stats — public, no auth required
func GetPublicStats(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var stats PublicStats

		db.Raw("SELECT COUNT(*) FROM tours WHERE status_id = (SELECT id FROM statuses WHERE name = 'active')").Scan(&stats.TotalTours)
		db.Raw("SELECT COUNT(*) FROM bookings WHERE status IN ('confirmed', 'pending')").Scan(&stats.TotalBookings)
		db.Raw("SELECT COUNT(*) FROM tour_users").Scan(&stats.TotalUsers)
		db.Raw("SELECT COALESCE(AVG(rating), 0) FROM tours WHERE rating > 0").Scan(&stats.AverageRating)

		return c.JSON(http.StatusOK, stats)
	}
}