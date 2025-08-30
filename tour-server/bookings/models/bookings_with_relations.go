package models

import (
	tourDateModels "tour-server/tourdate/models"
)

type BookingsWithRelations struct {
	Bookings
	TourDate tourDateModels.TourDateExtended `json:"tour_date" gorm:"foreignKey:TourDateID;references:ID"`
}

func (BookingsWithRelations) TableName() string {
	return "bookings"
}
