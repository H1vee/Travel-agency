package models

import "time"

type TourView struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id" gorm:"not null;uniqueIndex:idx_user_tour"`
	TourID    uint      `json:"tour_id" gorm:"not null;uniqueIndex:idx_user_tour"`
	ViewedAt  time.Time `json:"viewed_at" gorm:"not null;default:NOW()"`
	ViewCount int       `json:"view_count" gorm:"not null;default:1"`
}

func (TourView) TableName() string {
	return "tour_views"
}
