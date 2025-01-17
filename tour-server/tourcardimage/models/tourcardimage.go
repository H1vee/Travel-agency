package models

type TourCardImage struct {
	ID       uint   `json:"id" gorm:"primaryKey"`
	TourID   uint   `json:"tourId" gorm:"not null;unique"`
	ImageSrc string `json:"imageSrc" gorm:"not null"`
}
