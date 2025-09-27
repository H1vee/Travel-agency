package dto

type SearchTour struct {
	ID uint `json:"id"`
}

type SearchTourResult struct {
	ID       uint    `json:"id"`
	Title    string  `json:"title"`
	Price    float64 `json:"price"`
	Rating   float64 `json:"rating"`
	ImageSrc string  `json:"imageSrc"`
}