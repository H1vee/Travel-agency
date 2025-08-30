package dto

type UpdateProfileRequest struct {
	Name      string  `json:"name"`
	Phone     *string `json:"phone"`
	AvatarURL *string `json:"avatar_url"`
}
