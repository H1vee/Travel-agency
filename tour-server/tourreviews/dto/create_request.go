package dto

type TourReviewCreateRequest struct {
	TourID    uint   `json:"tour_id" binding:"required"`
	Rating    int    `json:"rating" binding:"required,min=1,max=5"`
	Comment   string `json:"comment"`
	BookingID *uint  `json:"booking_id,omitempty"`
}
