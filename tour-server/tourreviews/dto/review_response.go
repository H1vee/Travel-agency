package dto

import "time"

type TourReviewResponse struct {
	ID        uint      `json:"id"`
	UserID    uint      `json:"user_id"`
	Rating    int       `json:"rating"`
	Comment   string    `json:"comment"`
	CreatedAt time.Time `json:"created_at"`
}
