package dto

type TourSeatsDTO struct {
	ID             uint    `json:"id"`
	TourDateID     uint    `json:"tour_date_id"`
	AvailableSeats uint    `json:"available_seats"`
	Price          float64 `json:"price"`
}
