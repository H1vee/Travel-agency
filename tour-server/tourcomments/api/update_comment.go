package api

import (
	"log"
	"net/http"
	"tour-server/tourcomments/dto"
	"tour-server/tourcomments/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func UpdateComment(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		commentID := c.Param("id")
		userID := c.Get("user_id").(uint)

		var req dto.CommentUpdateRequest
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

		var comment models.TourComment
		err := db.Where("id = ? AND user_id = ?", commentID, userID).First(&comment).Error
		
		if err == gorm.ErrRecordNotFound {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "Comment not found or you don't have permission to edit it",
			})
		} else if err != nil {
			log.Printf("Database error: %v", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Database error",
			})
		}

		comment.Comment = req.Comment
		comment.Rating = req.Rating

		if err := db.Save(&comment).Error; err != nil {
			log.Printf("Failed to update comment: %v", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to update comment",
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

		return c.JSON(http.StatusOK, map[string]interface{}{
			"message": "Comment updated successfully",
			"comment": response,
		})
	}
}
