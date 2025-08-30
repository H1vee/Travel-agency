package models

import (
	"time"
	locationModels "tour-server/location/models"
	tourModels "tour-server/tour/models"
)

type TourDate struct {
	ID             uint      `json:"id" gorm:"primaryKey"`
	TourID         uint      `json:"tourId" gorm:"not null"`
	FromLocationID uint      `json:"fromLocationId" gorm:"not null"`
	ToLocationID   uint      `json:"toLocationId" gorm:"not null"`
	DateFrom       time.Time `json:"dateFrom" gorm:"not null"`
	DateTo         time.Time `json:"dateTo" gorm:"not null"`

	Tour         tourModels.Tour         `json:"tour,omitempty" gorm:"foreignKey:TourID;references:ID"`
	FromLocation locationModels.Location `json:"from_location,omitempty" gorm:"foreignKey:FromLocationID;references:ID"`
	ToLocation   locationModels.Location `json:"to_location,omitempty" gorm:"foreignKey:ToLocationID;references:ID"`
}

func (TourDate) TableName() string {
	return "tour_dates"
}
