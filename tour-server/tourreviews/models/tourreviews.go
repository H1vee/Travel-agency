package models

import "time"

type TourReviews struct {
	ID        uint `json:"id" gorm:"primaryKey"`
	TourID    uint `gorm:"not null"`
	UserID    uint `gorm:"not null"`
	BookingID *uint
	Rating    int `gorm:"not null;check:rating >= 1 AND rating <= 5"`
	Comment   string
	CreatedAt time.Time
	UpdatedAt time.Time
}
