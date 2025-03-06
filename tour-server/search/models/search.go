package models

type Tour struct {
	ID       uint    `json:"tour_id"`
	Title    string  `json:"title"`
	Rating   float32 `json:"rating"`
	Duration int     `json:"duration"`
	Price    float32 `json:"price"`
}
