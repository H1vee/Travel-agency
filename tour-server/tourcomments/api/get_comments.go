package api

import (
	"net/http"
	"strconv"
	"tour-server/tourcomments/dto"
	"tour-server/tourcomments/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func GetTourComments(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		tourID := c.Param("id")
		if tourID == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Tour ID is required",
			})
		}

		var currentUserID uint
		if userID := c.Get("user_id"); userID != nil {
			if uid, ok := userID.(uint); ok {
				currentUserID = uid
			}
		}

		page, _ := strconv.Atoi(c.QueryParam("page"))
		if page <= 0 {
			page = 1
		}
		
		limit, _ := strconv.Atoi(c.QueryParam("limit"))
		if limit <= 0 || limit > 50 {
			limit = 10
		}
		
		offset := (page - 1) * limit

		var comments []models.TourComment
		var total int64

		db.Model(&models.TourComment{}).Where("tour_id = ?", tourID).Count(&total)

		err := db.Preload("User").
			Where("tour_id = ?", tourID).
			Order("created_at DESC").
			Limit(limit).
			Offset(offset).
			Find(&comments).Error

		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch comments",
			})
		}

		var response []dto.CommentResponse
		for _, comment := range comments {
			commentResponse := dto.CommentResponse{
				ID:         comment.ID,
				TourID:     comment.TourID,
				UserID:     comment.UserID,
				UserName:   comment.User.Name,
				UserAvatar: comment.User.AvatarURL,
				Comment:    comment.Comment,
				Rating:     comment.Rating,
				CreatedAt:  comment.CreatedAt,
				UpdatedAt:  comment.UpdatedAt,
				IsOwner:    comment.UserID == currentUserID,
			}
			response = append(response, commentResponse)
		}

		return c.JSON(http.StatusOK, map[string]interface{}{
			"comments": response,
			"pagination": map[string]interface{}{
				"page":       page,
				"limit":      limit,
				"total":      total,
				"totalPages": (total + int64(limit) - 1) / int64(limit),
			},
		})
	}
}
