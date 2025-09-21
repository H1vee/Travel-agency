package dto

type CommentCreateRequest struct {
	TourID  uint   `json:"tour_id" validate:"required"`
	Comment string `json:"comment" validate:"required,min=5,max=1000"`
	Rating  *int   `json:"rating,omitempty" validate:"omitempty,min=1,max=5"`
}

type CommentUpdateRequest struct {
	Comment string `json:"comment" validate:"required,min=5,max=1000"`
	Rating  *int   `json:"rating,omitempty" validate:"omitempty,min=1,max=5"`
}