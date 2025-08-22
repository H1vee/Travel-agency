package models

import "time"

type UserFavorite struct {
	ID        uint      `gorm:"primaryKey"`
	UserID    uint      `gorm:"not null"`
	TourID    uint      `gorm:"not null"`
	CreatedAt time.Time `gorm:"default:NOW()"`
}

func (UserFavorite) TableName() string {
	return "tour_user_favorites"
}
