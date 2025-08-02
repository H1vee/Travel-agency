package models

type UserFavorite struct {
	ID     uint `gorm:"primaryKey"`
	UserID uint `gorm:"not null"`
	TourID uint `gorm:"not null"`
}
