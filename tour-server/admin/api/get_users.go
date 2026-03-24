package api

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type AdminUserItem struct {
	ID         uint   `json:"id"`
	Email      string `json:"email"`
	Name       string `json:"name"`
	Phone      string `json:"phone"`
	Role       string `json:"role"`
	IsVerified bool   `json:"is_verified"`
	CreatedAt  string `json:"created_at"`
	LastLogin  string `json:"last_login"`
}

type AdminUserDetail struct {
	AdminUserItem
	BookingsCount int64   `json:"bookings_count"`
	TotalSpent    float64 `json:"total_spent"`
}

func GetAdminUsers(db *gorm.DB) echo.HandlerFunc {
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

		var total int64
		db.Table("tour_users").Count(&total)

		var users []AdminUserItem
		err := db.Table("tour_users").
			Select("id, email, name, phone, role, is_verified, created_at, last_login").
			Order("created_at DESC").
			Offset(offset).
			Limit(limit).
			Find(&users).Error

		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch users",
			})
		}

		totalPages := int((total + int64(limit) - 1) / int64(limit))

		return c.JSON(http.StatusOK, map[string]interface{}{
			"users":       users,
			"total":       total,
			"page":        page,
			"limit":       limit,
			"total_pages": totalPages,
		})
	}
}

func GetAdminUserDetail(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		userID := c.Param("id")

		var user AdminUserDetail
		err := db.Table("tour_users").
			Select("id, email, name, phone, role, is_verified, created_at, last_login").
			Where("id = ?", userID).
			First(&user).Error

		if err != nil {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "User not found",
			})
		}

		db.Table("bookings").Where("user_id = ?", userID).Count(&user.BookingsCount)

		db.Table("bookings").
			Where("user_id = ? AND status = ?", userID, "confirmed").
			Select("COALESCE(SUM(total_price), 0)").
			Scan(&user.TotalSpent)

		var bookings []AdminBookingItem
		db.Table("bookings").
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
			Where("bookings.user_id = ?", userID).
			Order("bookings.booked_at DESC").
			Limit(20).
			Find(&bookings)

		return c.JSON(http.StatusOK, map[string]interface{}{
			"user":     user,
			"bookings": bookings,
		})
	}
}