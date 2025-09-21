package dto

import "time"

type CommentResponse struct {
	ID        uint      `json:"id"`
	TourID    uint      `json:"tour_id"`
	UserID    uint      `json:"user_id"`
	UserName  string    `json:"user_name"`
	UserAvatar string   `json:"user_avatar,omitempty"`
	Comment   string    `json:"comment"`
	Rating    *int      `json:"rating,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	IsOwner   bool      `json:"is_owner"`
}