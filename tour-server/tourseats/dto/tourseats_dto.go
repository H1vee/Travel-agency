package dto

type TourSeatsDTO struct {
	ID             uint `json:"id"`
	TourDateID     uint `json:"tourDateID"`
	AvailableSeats uint `json:"availableSeats"`
}
