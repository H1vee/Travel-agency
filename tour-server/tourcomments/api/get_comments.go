package api

import (
	"net/http"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type ReplyRow struct {
	ID              uint      `json:"id"`
	UserID          *uint     `json:"user_id"`
	UserName        string    `json:"user_name"`
	UserAvatar      string    `json:"user_avatar"`
	Comment         string    `json:"comment"`
	IsGuest         bool      `json:"is_guest"`
	IsOwner         bool      `json:"is_owner"`
	IsVerifiedBuyer bool      `json:"is_verified_buyer"`
	LikesCount      int       `json:"likes_count"`
	DislikesCount   int       `json:"dislikes_count"`
	LikedByMe       bool      `json:"liked_by_me"`
	DislikedByMe    bool      `json:"disliked_by_me"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type CommentRow struct {
	ID              uint       `json:"id"`
	TourID          uint       `json:"tour_id"`
	UserID          *uint      `json:"user_id"`
	UserName        string     `json:"user_name"`
	UserAvatar      string     `json:"user_avatar"`
	GuestName       *string    `json:"guest_name"`
	Comment         string     `json:"comment"`
	Rating          *int       `json:"rating"`
	IsVerifiedBuyer bool       `json:"is_verified_buyer"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	IsOwner         bool       `json:"is_owner"`
	IsGuest         bool       `json:"is_guest"`
	LikesCount      int        `json:"likes_count"`
	DislikesCount   int        `json:"dislikes_count"`
	LikedByMe       bool       `json:"liked_by_me"`
	DislikedByMe    bool       `json:"disliked_by_me"`
	Replies         []ReplyRow `json:"replies"`
}

func GetTourComments(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		tourID := c.Param("id")

		page, _ := strconv.Atoi(c.QueryParam("page"))
		if page <= 0 { page = 1 }
		limit, _ := strconv.Atoi(c.QueryParam("limit"))
		if limit <= 0 || limit > 50 { limit = 10 }
		offset := (page - 1) * limit

		var currentUserID uint
		if uid := c.Get("user_id"); uid != nil {
			currentUserID = uid.(uint)
		}
		guestToken := c.Request().Header.Get("X-Guest-Token")

		var total int64
		db.Table("tour_reviews").Where("tour_id = ? AND parent_id IS NULL", tourID).Count(&total)

		type rawRow struct {
			ID              uint      `gorm:"column:id"`
			TourID          uint      `gorm:"column:tour_id"`
			UserID          *uint     `gorm:"column:user_id"`
			UserName        *string   `gorm:"column:user_name"`
			UserAvatar      *string   `gorm:"column:user_avatar"`
			GuestName       *string   `gorm:"column:guest_name"`
			Comment         string    `gorm:"column:comment"`
			Rating          *int      `gorm:"column:rating"`
			IsVerifiedBuyer bool      `gorm:"column:is_verified_buyer"`
			LikesCount      int       `gorm:"column:likes_count"`
			DislikesCount   int       `gorm:"column:dislikes_count"`
			LikedByMe       bool      `gorm:"column:liked_by_me"`
			DislikedByMe    bool      `gorm:"column:disliked_by_me"`
			CreatedAt       time.Time `gorm:"column:created_at"`
			UpdatedAt       time.Time `gorm:"column:updated_at"`
		}

		likeSubquery := func(identityCol, identityVal, reactionType string) string {
			return "EXISTS (SELECT 1 FROM tour_review_likes l WHERE l.review_id = tr.id AND l." +
				identityCol + " = " + identityVal + " AND l.reaction_type = '" + reactionType + "')"
		}

		buildMainSQL := func(likedExpr, dislikedExpr string) string {
			return `
				SELECT tr.id, tr.tour_id, tr.user_id,
					tu.name AS user_name, tu.avatar_url AS user_avatar,
					tr.guest_name, tr.comment, tr.rating,
					tr.is_verified_buyer, tr.created_at, tr.updated_at,
					COALESCE((SELECT COUNT(*) FROM tour_review_likes l WHERE l.review_id = tr.id AND l.reaction_type = 'like'), 0) AS likes_count,
					COALESCE((SELECT COUNT(*) FROM tour_review_likes l WHERE l.review_id = tr.id AND l.reaction_type = 'dislike'), 0) AS dislikes_count,
					` + likedExpr + ` AS liked_by_me,
					` + dislikedExpr + ` AS disliked_by_me
				FROM tour_reviews tr
				LEFT JOIN tour_users tu ON tr.user_id = tu.id
				WHERE tr.tour_id = ? AND tr.parent_id IS NULL
				ORDER BY tr.created_at DESC
				LIMIT ? OFFSET ?`
		}

		buildReplySQL := func(likedExpr, dislikedExpr string) string {
			return `
				SELECT tr.id, tr.parent_id, tr.user_id,
					tu.name AS user_name, tu.avatar_url AS user_avatar,
					tr.guest_name, tr.comment, tr.is_verified_buyer,
					tr.created_at, tr.updated_at,
					COALESCE((SELECT COUNT(*) FROM tour_review_likes l WHERE l.review_id = tr.id AND l.reaction_type = 'like'), 0) AS likes_count,
					COALESCE((SELECT COUNT(*) FROM tour_review_likes l WHERE l.review_id = tr.id AND l.reaction_type = 'dislike'), 0) AS dislikes_count,
					` + likedExpr + ` AS liked_by_me,
					` + dislikedExpr + ` AS disliked_by_me
				FROM tour_reviews tr
				LEFT JOIN tour_users tu ON tr.user_id = tu.id
				WHERE tr.parent_id IN ?
				ORDER BY tr.created_at ASC`
		}

		var likedExpr, dislikedExpr string
		var mainArgs, replyArgs []interface{}

		if currentUserID > 0 {
			id := strconv.FormatUint(uint64(currentUserID), 10)
			likedExpr = likeSubquery("user_id", id, "like")
			dislikedExpr = likeSubquery("user_id", id, "dislike")
			mainArgs = []interface{}{tourID, limit, offset}
		} else if guestToken != "" {
			likedExpr = likeSubquery("guest_token", "'"+guestToken+"'", "like")
			dislikedExpr = likeSubquery("guest_token", "'"+guestToken+"'", "dislike")
			mainArgs = []interface{}{tourID, limit, offset}
		} else {
			likedExpr = "false"
			dislikedExpr = "false"
			mainArgs = []interface{}{tourID, limit, offset}
		}

		var rows []rawRow
		db.Raw(buildMainSQL(likedExpr, dislikedExpr), mainArgs...).Scan(&rows)

		if len(rows) == 0 {
			totalPages := (total + int64(limit) - 1) / int64(limit)
			return c.JSON(http.StatusOK, map[string]interface{}{
				"comments": []interface{}{},
				"pagination": map[string]interface{}{"page": page, "limit": limit, "total": total, "totalPages": totalPages},
			})
		}

		parentIDs := make([]uint, 0, len(rows))
		for _, r := range rows { parentIDs = append(parentIDs, r.ID) }
		replyArgs = []interface{}{parentIDs}

		type rawReply struct {
			ID              uint      `gorm:"column:id"`
			ParentID        uint      `gorm:"column:parent_id"`
			UserID          *uint     `gorm:"column:user_id"`
			UserName        *string   `gorm:"column:user_name"`
			UserAvatar      *string   `gorm:"column:user_avatar"`
			GuestName       *string   `gorm:"column:guest_name"`
			Comment         string    `gorm:"column:comment"`
			IsVerifiedBuyer bool      `gorm:"column:is_verified_buyer"`
			LikesCount      int       `gorm:"column:likes_count"`
			DislikesCount   int       `gorm:"column:dislikes_count"`
			LikedByMe       bool      `gorm:"column:liked_by_me"`
			DislikedByMe    bool      `gorm:"column:disliked_by_me"`
			CreatedAt       time.Time `gorm:"column:created_at"`
			UpdatedAt       time.Time `gorm:"column:updated_at"`
		}

		var rawReplies []rawReply
		db.Raw(buildReplySQL(likedExpr, dislikedExpr), replyArgs...).Scan(&rawReplies)

		resolve := func(uid *uint, uname, gname, uavatar *string) (string, string) {
			name := "Гість"
			if gname != nil && *gname != "" { name = *gname } else if uname != nil { name = *uname }
			avatar := ""
			if uavatar != nil { avatar = *uavatar }
			return name, avatar
		}

		repliesByParent := make(map[uint][]ReplyRow)
		for _, r := range rawReplies {
			isGuest := r.UserID == nil
			isOwner := !isGuest && currentUserID > 0 && *r.UserID == currentUserID
			name, avatar := resolve(r.UserID, r.UserName, r.GuestName, r.UserAvatar)
			repliesByParent[r.ParentID] = append(repliesByParent[r.ParentID], ReplyRow{
				ID: r.ID, UserID: r.UserID, UserName: name, UserAvatar: avatar,
				Comment: r.Comment, IsGuest: isGuest, IsOwner: isOwner,
				IsVerifiedBuyer: r.IsVerifiedBuyer,
				LikesCount: r.LikesCount, DislikesCount: r.DislikesCount,
				LikedByMe: r.LikedByMe, DislikedByMe: r.DislikedByMe,
				CreatedAt: r.CreatedAt, UpdatedAt: r.UpdatedAt,
			})
		}

		comments := make([]CommentRow, 0, len(rows))
		for _, r := range rows {
			isGuest := r.UserID == nil
			isOwner := !isGuest && currentUserID > 0 && *r.UserID == currentUserID
			name, avatar := resolve(r.UserID, r.UserName, r.GuestName, r.UserAvatar)
			replies := repliesByParent[r.ID]
			if replies == nil { replies = []ReplyRow{} }
			comments = append(comments, CommentRow{
				ID: r.ID, TourID: r.TourID, UserID: r.UserID, UserName: name, UserAvatar: avatar,
				GuestName: r.GuestName, Comment: r.Comment, Rating: r.Rating,
				IsVerifiedBuyer: r.IsVerifiedBuyer, CreatedAt: r.CreatedAt, UpdatedAt: r.UpdatedAt,
				IsOwner: isOwner, IsGuest: isGuest,
				LikesCount: r.LikesCount, DislikesCount: r.DislikesCount,
				LikedByMe: r.LikedByMe, DislikedByMe: r.DislikedByMe,
				Replies: replies,
			})
		}

		totalPages := (total + int64(limit) - 1) / int64(limit)
		return c.JSON(http.StatusOK, map[string]interface{}{
			"comments": comments,
			"pagination": map[string]interface{}{"page": page, "limit": limit, "total": total, "totalPages": totalPages},
		})
	}
}