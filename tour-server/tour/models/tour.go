package models

type Tour struct {
	ID                  uint    `json:"id" gorm:"primaryKey"`
	Title               string  `json:"title" gorm:"not null"`
	Description         string  `json:"description"`
	CallToAction        string  `json:"callToAction" gorm:"not null"`
	Price               float64 `json:"price" gorm:"not null"`
	Rating              float64 `json:"rating" gorm:"default:0.0"`
	StatusID            uint    `json:"statusId" gorm:"not null"`
	DetailedDescription string  `json:"detailedDescription"`
	TotalSeats          int     `json:"total_seats"`
}
