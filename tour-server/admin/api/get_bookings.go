package api

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type AdminBookingItem struct {
	ID             uint    `json:"id"`
	TourTitle      string  `json:"tour_title"`
	CustomerName   string  `json:"customer_name"`
	CustomerEmail  string  `json:"customer_email"`
	CustomerPhone  string  `json:"customer_phone"`
	Seats          int     `json:"seats"`
	TotalPrice     float64 `json:"total_price"`
	Status         string  `json:"status"`
	BookedAt       string  `json:"booked_at"`
	UserID         *uint   `json:"user_id"`
	IsGuestBooking bool    `json:"is_guest_booking"`
}

func GetAdminBookings(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		page, _ := strconv.Atoi(c.QueryParam("page"))
		if page <= 0 {
			page = 1
		}
		limit, _ := strconv.Atoi(c.QueryParam("limit"))
		if limit <= 0 || limit > 100 {
			limit = 20
		}
		offset := (page - 1) * limit

		statusFilter := c.QueryParam("status")

		var total int64
		countQuery := db.Table("bookings")
		if statusFilter != "" {
			countQuery = countQuery.Where("status = ?", statusFilter)
		}
		countQuery.Count(&total)

		var bookings []AdminBookingItem
		query := db.Table("bookings").
			Select(`bookings.id, 
				tours.title as tour_title,
				bookings.customer_name, 
				bookings.customer_email,
				bookings.customer_phone, 
				bookings.seats, 
				bookings.total_price,
				bookings.status, 
				bookings.booked_at, 
				bookings.user_id,
				bookings.is_guest_booking`).
			Joins("JOIN tour_dates ON bookings.tour_date_id = tour_dates.id").
			Joins("JOIN tours ON tour_dates.tour_id = tours.id").
			Order("bookings.booked_at DESC").
			Offset(offset).
			Limit(limit)

		if statusFilter != "" {
			query = query.Where("bookings.status = ?", statusFilter)
		}

		if err := query.Find(&bookings).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch bookings",
			})
		}

		totalPages := int((total + int64(limit) - 1) / int64(limit))

		return c.JSON(http.StatusOK, map[string]interface{}{
			"bookings":    bookings,
			"total":       total,
			"page":        page,
			"limit":       limit,
			"total_pages": totalPages,
		})
	}
}