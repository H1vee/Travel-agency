package api

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type MonthlyBookings struct {
	Month     string `json:"month"`
	Confirmed int64  `json:"confirmed"`
	Pending   int64  `json:"pending"`
	Cancelled int64  `json:"cancelled"`
}

type MonthlyRevenue struct {
	Month   string  `json:"month"`
	Revenue float64 `json:"revenue"`
}

type PopularTour struct {
	ID            uint    `json:"id"`
	Title         string  `json:"title"`
	BookingsCount int64   `json:"bookings_count"`
	Revenue       float64 `json:"revenue"`
}

func GetBookingsByMonth(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var results []MonthlyBookings

		err := db.Raw(`
			SELECT 
				TO_CHAR(booked_at, 'YYYY-MM') as month,
				COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
				COUNT(*) FILTER (WHERE status = 'pending') as pending,
				COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
			FROM bookings
			WHERE booked_at >= NOW() - INTERVAL '12 months'
			GROUP BY TO_CHAR(booked_at, 'YYYY-MM')
			ORDER BY month ASC
		`).Scan(&results).Error

		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch bookings by month",
			})
		}

		return c.JSON(http.StatusOK, results)
	}
}

func GetRevenueByMonth(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var results []MonthlyRevenue

		err := db.Raw(`
			SELECT 
				TO_CHAR(booked_at, 'YYYY-MM') as month,
				COALESCE(SUM(total_price), 0) as revenue
			FROM bookings
			WHERE status = 'confirmed'
				AND booked_at >= NOW() - INTERVAL '12 months'
			GROUP BY TO_CHAR(booked_at, 'YYYY-MM')
			ORDER BY month ASC
		`).Scan(&results).Error

		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch revenue by month",
			})
		}

		return c.JSON(http.StatusOK, results)
	}
}

func GetPopularTours(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var results []PopularTour

		err := db.Raw(`
			SELECT 
				tours.id,
				tours.title,
				COUNT(bookings.id) as bookings_count,
				COALESCE(SUM(bookings.total_price), 0) as revenue
			FROM tours
			JOIN tour_dates ON tours.id = tour_dates.tour_id
			JOIN bookings ON tour_dates.id = bookings.tour_date_id
			GROUP BY tours.id, tours.title
			ORDER BY bookings_count DESC
			LIMIT 10
		`).Scan(&results).Error

		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch popular tours",
			})
		}

		return c.JSON(http.StatusOK, results)
	}
}