package api

import (
	"log"
	"net/http"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type CreateCommentRequest struct {
	TourID    uint   `json:"tour_id"`
	ParentID  *uint  `json:"parent_id,omitempty"` // nil = top-level, set = reply
	Comment   string `json:"comment"`
	Rating    *int   `json:"rating,omitempty"` // only for top-level
	GuestName string `json:"guest_name,omitempty"`
}

func CreateComment(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req CreateCommentRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request format"})
		}

		if req.TourID == 0 {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "tour_id is required"})
		}
		if len([]rune(req.Comment)) < 1 {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Коментар порожній"})
		}

		// If reply — verify parent exists and belongs to same tour
		if req.ParentID != nil {
			var parentTourID uint
			err := db.Raw("SELECT tour_id FROM tour_reviews WHERE id = ? AND parent_id IS NULL",
				*req.ParentID).Scan(&parentTourID).Error
			if err != nil || parentTourID == 0 {
				return c.JSON(http.StatusBadRequest, map[string]string{"error": "Батьківський коментар не знайдено"})
			}
			if parentTourID != req.TourID {
				return c.JSON(http.StatusBadRequest, map[string]string{"error": "Невірний tour_id для відповіді"})
			}
			// Replies don't have a rating
			req.Rating = nil
		}

		userIDVal := c.Get("user_id")
		isGuest := userIDVal == nil

		var userID *uint
		var guestName *string
		var isVerifiedBuyer bool

		if !isGuest {
			uid := userIDVal.(uint)
			userID = &uid

			var count int64
			db.Raw(`
				SELECT COUNT(*) FROM bookings b
				JOIN tour_dates td ON b.tour_date_id = td.id
				WHERE td.tour_id = ? AND b.user_id = ? AND b.status = 'confirmed'
			`, req.TourID, uid).Scan(&count)
			isVerifiedBuyer = count > 0
		} else {
			name := req.GuestName
			if name == "" {
				name = "Гість"
			}
			guestName = &name
		}

		type insertRow struct {
			TourID          uint    `gorm:"column:tour_id"`
			ParentID        *uint   `gorm:"column:parent_id"`
			UserID          *uint   `gorm:"column:user_id"`
			GuestName       *string `gorm:"column:guest_name"`
			Comment         string  `gorm:"column:comment"`
			Rating          *int    `gorm:"column:rating"`
			IsVerifiedBuyer bool    `gorm:"column:is_verified_buyer"`
		}

		row := insertRow{
			TourID:          req.TourID,
			ParentID:        req.ParentID,
			UserID:          userID,
			GuestName:       guestName,
			Comment:         req.Comment,
			Rating:          req.Rating,
			IsVerifiedBuyer: isVerifiedBuyer,
		}

		if err := db.Table("tour_reviews").Create(&row).Error; err != nil {
			log.Printf("Failed to create comment: %v", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create comment"})
		}

		return c.JSON(http.StatusCreated, map[string]interface{}{
			"message":           "Comment created",
			"is_verified_buyer": isVerifiedBuyer,
			"is_guest":          isGuest,
		})
	}
}