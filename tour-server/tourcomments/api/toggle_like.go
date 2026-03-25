package api

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// POST /tour-comments/:id/like
// Body: { "type": "like" | "dislike" }
// - якщо такої реакції немає — створює
// - якщо та сама реакція вже є — прибирає (toggle)
// - якщо протилежна реакція є — замінює

func ToggleLike(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		commentID, err := strconv.Atoi(c.Param("id"))
		if err != nil || commentID <= 0 {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid comment ID"})
		}

		var body struct {
			Type string `json:"type"` // "like" or "dislike"
		}
		if err := c.Bind(&body); err != nil || (body.Type != "like" && body.Type != "dislike") {
			body.Type = "like" // default
		}

		var userID *uint
		if uid := c.Get("user_id"); uid != nil {
			u := uid.(uint)
			userID = &u
		}
		guestToken := c.Request().Header.Get("X-Guest-Token")

		if userID == nil && guestToken == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Потрібен токен або авторизація"})
		}

		// Find existing reaction
		var existingType string
		var existingID int64

		if userID != nil {
			db.Raw("SELECT id, reaction_type FROM tour_review_likes WHERE review_id = ? AND user_id = ?",
				commentID, *userID).Row().Scan(&existingID, &existingType)
		} else {
			db.Raw("SELECT id, reaction_type FROM tour_review_likes WHERE review_id = ? AND guest_token = ?",
				commentID, guestToken).Row().Scan(&existingID, &existingType)
		}

		if existingID > 0 {
			if existingType == body.Type {
				// Same reaction — remove it
				db.Exec("DELETE FROM tour_review_likes WHERE id = ?", existingID)
			} else {
				// Different reaction — replace
				db.Exec("UPDATE tour_review_likes SET reaction_type = ? WHERE id = ?", body.Type, existingID)
			}
		} else {
			// New reaction
			if userID != nil {
				db.Exec("INSERT INTO tour_review_likes (review_id, user_id, reaction_type) VALUES (?, ?, ?)",
					commentID, *userID, body.Type)
			} else {
				db.Exec("INSERT INTO tour_review_likes (review_id, guest_token, reaction_type) VALUES (?, ?, ?)",
					commentID, guestToken, body.Type)
			}
		}

		// Return updated counts
		var likes, dislikes int64
		db.Raw("SELECT COUNT(*) FROM tour_review_likes WHERE review_id = ? AND reaction_type = 'like'", commentID).Scan(&likes)
		db.Raw("SELECT COUNT(*) FROM tour_review_likes WHERE review_id = ? AND reaction_type = 'dislike'", commentID).Scan(&dislikes)

		return c.JSON(http.StatusOK, map[string]interface{}{
			"likes_count":    likes,
			"dislikes_count": dislikes,
		})
	}
}