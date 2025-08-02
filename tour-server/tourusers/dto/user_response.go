package dto

type UserResponse struct {
	ID         uint   `json:"id"`
	Email      string `json:"email"`
	Name       string `json:"name"`
	Phone      string `json:"phone,omitempty"`
	AvatarURL  string `json:"avatar_url,omitempty"`
	Role       string `json:"role"`
	IsVerified bool   `json:"is_verified"`
}
