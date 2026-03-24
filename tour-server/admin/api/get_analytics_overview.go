package api

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type OverviewStats struct {
	TotalTours     int64   `json:"total_tours"`
	TotalBookings  int64   `json:"total_bookings"`
	TotalUsers     int64   `json:"total_users"`
	TotalRevenue   float64 `json:"total_revenue"`
	PendingCount   int64   `json:"pending_count"`
	ConfirmedCount int64   `json:"confirmed_count"`
	CancelledCount int64   `json:"cancelled_count"`
}

func GetAnalyticsOverview(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var stats OverviewStats

		db.Table("tours").Count(&stats.TotalTours)
		db.Table("bookings").Count(&stats.TotalBookings)
		db.Table("tour_users").Count(&stats.TotalUsers)

		db.Table("bookings").
			Where("status = ?", "confirmed").
			Select("COALESCE(SUM(total_price), 0)").
			Scan(&stats.TotalRevenue)

		db.Table("bookings").Where("status = ?", "pending").Count(&stats.PendingCount)
		db.Table("bookings").Where("status = ?", "confirmed").Count(&stats.ConfirmedCount)
		db.Table("bookings").Where("status = ?", "cancelled").Count(&stats.CancelledCount)

		return c.JSON(http.StatusOK, stats)
	}
}