package models

import (
	"time"
)

type TourDate struct {
	ID             uint      `json:"id" gorm:"primaryKey"`
	TourID         uint      `json:"tourId" gorm:"not null"`
	FromLocationID uint      `json:"fromLocationId" gorm:"not null"`
	ToLocationID   uint      `json:"toLocationId" gorm:"not null"`
	DateFrom       time.Time `json:"dateFrom" gorm:"not null"`
	DateTo         time.Time `json:"dateTo" gorm:"not null"`
}
