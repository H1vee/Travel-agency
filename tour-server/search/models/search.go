package models

type Tour struct {
	ID       uint    `json:"tour_id"`
	Title    string  `json:"title"`
	Rating   float64 `json:"rating"`
	Duration int     `json:"duration"`
	Price    float64 `json:"price"`
}
