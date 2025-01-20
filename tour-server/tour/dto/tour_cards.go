package dto

type TourCard struct {
	ID       uint    `json:"id"`
	Title    string  `json:"title"`
	Price    float64 `json:"price"`
	ImageSrc *string `json:"imageSrc" gorm:"not null"`
}
