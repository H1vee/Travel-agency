package api

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type OverviewStats struct {
	TotalCars       int64 `json:"total_cars"`
	ActiveCars      int64 `json:"active_cars"`
	HiddenCars      int64 `json:"hidden_cars"`
	TotalInquiries  int64 `json:"total_inquiries"`
	NewInquiries    int64 `json:"new_inquiries"`
	ProcessedLeads  int64 `json:"processed_inquiries"`
}

// GetAnalyticsOverview returns headline figures for the admin dashboard.
func GetAnalyticsOverview(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var stats OverviewStats

		db.Table("cars").Count(&stats.TotalCars)
		db.Table("cars").Where("status_id = (SELECT id FROM statuses WHERE name = 'active')").Count(&stats.ActiveCars)
		db.Table("cars").Where("status_id = (SELECT id FROM statuses WHERE name = 'hidden')").Count(&stats.HiddenCars)

		db.Table("inquiries").Count(&stats.TotalInquiries)
		db.Table("inquiries").Where("status = ?", "new").Count(&stats.NewInquiries)
		db.Table("inquiries").Where("status = ?", "processed").Count(&stats.ProcessedLeads)

		return c.JSON(http.StatusOK, stats)
	}
}
