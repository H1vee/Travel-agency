package api

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type AdminInquiryItem struct {
	ID            uint    `json:"id"`
	CarID         *uint   `json:"car_id"`
	CarLabel      *string `json:"car_label"`
	RequestType   string  `json:"request_type"`
	ContactMethod string  `json:"contact_method"`
	Phone         string  `json:"phone"`
	Name          string  `json:"name"`
	Message       string  `json:"message"`
	Status        string  `json:"status"`
	CreatedAt     string  `json:"created_at"`
}

// GetAdminInquiries lists submitted leads, newest first, with optional status filter.
func GetAdminInquiries(db *gorm.DB) echo.HandlerFunc {
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

		base := db.Table("inquiries").
			Select(`
				inquiries.id, inquiries.car_id,
				CASE WHEN cars.id IS NOT NULL
					THEN CONCAT(cars.make, ' ', cars.model, ' (', cars.year, ')')
					ELSE NULL END AS car_label,
				inquiries.request_type, inquiries.contact_method,
				inquiries.phone, inquiries.name, inquiries.message,
				inquiries.status, inquiries.created_at
			`).
			Joins("LEFT JOIN cars ON inquiries.car_id = cars.id")

		if status := strings.TrimSpace(c.QueryParam("status")); status != "" {
			base = base.Where("inquiries.status = ?", status)
		}

		var total int64
		base.Count(&total)

		var items []AdminInquiryItem
		err := base.Order("inquiries.created_at DESC").
			Offset(offset).Limit(limit).Find(&items).Error
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to fetch inquiries"})
		}

		totalPages := int((total + int64(limit) - 1) / int64(limit))
		return c.JSON(http.StatusOK, map[string]interface{}{
			"inquiries":   items,
			"total":       total,
			"page":        page,
			"limit":       limit,
			"total_pages": totalPages,
		})
	}
}

// UpdateInquiryStatus marks a lead as new or processed.
func UpdateInquiryStatus(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		id := c.Param("id")

		var body struct {
			Status string `json:"status"`
		}
		if err := c.Bind(&body); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
		}
		if body.Status != "new" && body.Status != "processed" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid status"})
		}

		result := db.Table("inquiries").Where("id = ?", id).Update("status", body.Status)
		if result.Error != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to update inquiry"})
		}
		if result.RowsAffected == 0 {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Inquiry not found"})
		}

		return c.JSON(http.StatusOK, map[string]string{"message": "Inquiry updated"})
	}
}
