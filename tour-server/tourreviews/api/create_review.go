package api

import (
	"log"
	"net/http"
	"tour-server/tourreviews/dto"
	"tour-server/tourreviews/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func CreateTourReview(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req dto.TourReviewCreateRequest

		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Invalid request format",
			})
		}
		if err := c.Validate(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Validation failed",
			})
		}
		userID := c.Get("user_id").(uint)

		review := models.TourReviews{
			TourID:    req.TourID,
			UserID:    userID,
			BookingID: req.BookingID,
			Rating:    req.Rating,
			Comment:   req.Comment,
		}

		if err := db.Create(&review).Error; err != nil {
			log.Printf("Failed to create tour review: %v\n", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to create review",
			})
		}

		response := dto.TourReviewResponse{
			ID:        review.ID,
			UserID:    review.UserID,
			Rating:    review.Rating,
			Comment:   review.Comment,
			CreatedAt: review.CreatedAt,
		}

		return c.JSON(http.StatusCreated, response)
	}
}
