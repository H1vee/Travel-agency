package models

import (
	locationModels "tour-server/location/models"
	tourModels "tour-server/tour/models"
)

type TourDateExtended struct {
	TourDate
	Tour         tourModels.Tour         `json:"tour" gorm:"foreignKey:TourID;references:ID"`
	FromLocation locationModels.Location `json:"from_location" gorm:"foreignKey:FromLocationID;references:ID"`
	ToLocation   locationModels.Location `json:"to_location" gorm:"foreignKey:ToLocationID;references:ID"`
}

func (TourDateExtended) TableName() string {
	return "tour_dates"
}
