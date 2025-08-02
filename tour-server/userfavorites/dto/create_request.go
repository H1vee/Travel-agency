package dto

type UserFavoriteCreateRequest struct {
	TourID uint `json:"tour_id" binding:"required"`
}
