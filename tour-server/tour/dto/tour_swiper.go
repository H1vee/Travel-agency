package dto

type TourSwiper struct {
	ID           uint   `json:"id"`
	Title        string `json:"title"`
	Description  string `json:"description"`
	CallToAction string `json:"callToAction"`
	ImageSrc     string `json:"imageSrc"`
}
