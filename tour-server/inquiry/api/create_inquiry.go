package api

import (
	"net/http"
	"strings"
	"tour-server/inquiry/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// validRequestTypes maps the three call-to-action buttons to stored values.
var validRequestTypes = map[string]bool{
	"turnkey_quote":   true, // "Get a turnkey quote"
	"renovation_cost": true, // "Calculate renovation costs"
	"question":        true, // "Ask a question"
}

type CreateInquiryRequest struct {
	CarID         *uint  `json:"carId"`
	RequestType   string `json:"requestType"`
	ContactMethod string `json:"contactMethod"`
	Phone         string `json:"phone"`
	Name          string `json:"name"`
	Message       string `json:"message"`
}

// CreateInquiry stores a lead submitted from any of the contact forms.
func CreateInquiry(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req CreateInquiryRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
		}

		req.Phone = strings.TrimSpace(req.Phone)
		if req.Phone == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Phone number is required"})
		}

		if !validRequestTypes[req.RequestType] {
			req.RequestType = "question"
		}

		inquiry := models.Inquiry{
			CarID:         req.CarID,
			RequestType:   req.RequestType,
			ContactMethod: strings.TrimSpace(req.ContactMethod),
			Phone:         req.Phone,
			Name:          strings.TrimSpace(req.Name),
			Message:       strings.TrimSpace(req.Message),
			Status:        "new",
		}

		if err := db.Create(&inquiry).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to save inquiry"})
		}

		return c.JSON(http.StatusCreated, map[string]interface{}{
			"message": "Inquiry received",
			"id":      inquiry.ID,
		})
	}
}
