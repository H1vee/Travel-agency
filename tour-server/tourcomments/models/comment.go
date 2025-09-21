package models

import (
	"time"
	userModels "tour-server/tourusers/models"
)

type TourComment struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	TourID    uint      `json:"tour_id" gorm:"not null"`
	UserID    uint      `json:"user_id" gorm:"not null"`
	Comment   string    `json:"comment" gorm:"not null"`
	Rating    *int      `json:"rating,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	User userModels.TourUser `json:"user" gorm:"foreignKey:UserID;references:ID"`
}

func (TourComment) TableName() string {
	return "tour_reviews"
}