package api

import (
	"log"
	"net/http"
	"tour-server/tourcomments/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func DeleteComment(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		commentID := c.Param("id")
		userID := c.Get("user_id").(uint)

		var comment models.TourComment
		err := db.Where("id = ? AND user_id = ?", commentID, userID).First(&comment).Error
		
		if err == gorm.ErrRecordNotFound {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "Comment not found or you don't have permission to delete it",
			})
		} else if err != nil {
			log.Printf("Database error: %v", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Database error",
			})
		}

		if err := db.Delete(&comment).Error; err != nil {
			log.Printf("Failed to delete comment: %v", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to delete comment",
			})
		}

		return c.JSON(http.StatusOK, map[string]string{
			"message": "Comment deleted successfully",
		})
	}
}