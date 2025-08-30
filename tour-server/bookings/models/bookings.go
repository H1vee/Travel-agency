package models

import (
	"time"
	tourDateModels "tour-server/tourdate/models"
)

type Bookings struct {
	ID             uint      `json:"id" gorm:"primaryKey"`
	TourDateID     uint      `json:"tour_date_id" gorm:"not null"`
	CustomerName   string    `json:"customer_name" gorm:"not null"`
	CustomerEmail  string    `json:"customer_email"`
	CustomerPhone  string    `json:"customer_phone" gorm:"not null"`
	Seats          uint      `json:"seats" gorm:"not null;check:seats > 0"`
	TotalPrice     float64   `json:"total_price" gorm:"type:numeric(10,2);not null"`
	Status         string    `json:"status" gorm:"default:pending;check:status IN ('pending', 'confirmed', 'cancelled')"`
	BookedAt       time.Time `json:"booked_at" gorm:"default:NOW()"`
	UserID         *uint     `json:"user_id" gorm:"index"`
	IsGuestBooking bool      `json:"is_guest_booking" gorm:"default:true"`

	TourDate tourDateModels.TourDate `json:"tour_date" gorm:"foreignKey:TourDateID;references:ID"`
}

func (Bookings) TableName() string {
	return "bookings"
}
