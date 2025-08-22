package api

import (
	"log"
	"net/http"
	"tour-server/tourreviews/dto"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func GetReviewsByTourID(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {

		tourID := c.Param("id")

		var reviews []dto.TourReviewResponse

		err := db.Table("tour_reviews").
			Select("id,user_id,rating,comment,created_at").
			Where("tour_id = ?", tourID).
			Scan(&reviews).Error

		if err != nil {
			log.Printf("Failed to fetch tour reviews: %v\n", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch reviews",
			})
		}

		return c.JSON(http.StatusOK, reviews)
	}
}
