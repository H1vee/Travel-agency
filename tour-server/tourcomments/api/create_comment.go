package api

import (
	"log"
	"net/http"
	"tour-server/tourcomments/dto"
	"tour-server/tourcomments/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func CreateComment(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req dto.CommentCreateRequest

		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Invalid request format",
			})
		}

		if err := c.Validate(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Validation failed: " + err.Error(),
			})
		}

		userID := c.Get("user_id").(uint)

		var existingComment models.TourComment
		err := db.Where("tour_id = ? AND user_id = ?", req.TourID, userID).First(&existingComment).Error
		
		if err == nil {
			return c.JSON(http.StatusConflict, map[string]string{
				"error": "You have already commented on this tour",
			})
		} else if err != gorm.ErrRecordNotFound {
			log.Printf("Database error: %v", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Database error",
			})
		}

		comment := models.TourComment{
			TourID:  req.TourID,
			UserID:  userID,
			Comment: req.Comment,
			Rating:  req.Rating,
		}

		if err := db.Create(&comment).Error; err != nil {
			log.Printf("Failed to create comment: %v", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to create comment",
			})
		}

		if err := db.Preload("User").First(&comment, comment.ID).Error; err != nil {
			log.Printf("Failed to load comment with user: %v", err)
		}

		response := dto.CommentResponse{
			ID:         comment.ID,
			TourID:     comment.TourID,
			UserID:     comment.UserID,
			UserName:   comment.User.Name,
			UserAvatar: comment.User.AvatarURL,
			Comment:    comment.Comment,
			Rating:     comment.Rating,
			CreatedAt:  comment.CreatedAt,
			UpdatedAt:  comment.UpdatedAt,
			IsOwner:    true,
		}

		return c.JSON(http.StatusCreated, map[string]interface{}{
			"message": "Comment created successfully",
			"comment": response,
		})
	}
}