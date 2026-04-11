package middleware

import (
	"html"
	"regexp"
	"strings"
	"unicode/utf8"
)

var (
	emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	phoneRegex = regexp.MustCompile(`^\+380\d{9}$`)
	// Strips HTML tags
	htmlTagRegex = regexp.MustCompile(`<[^>]*>`)
	// Strips control characters except newline and tab
	controlRegex = regexp.MustCompile(`[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]`)
)

// SanitizeString removes HTML tags, control characters, trims whitespace,
// and escapes HTML entities. Safe for storing in DB and rendering.
func SanitizeString(s string) string {
	s = htmlTagRegex.ReplaceAllString(s, "")
	s = controlRegex.ReplaceAllString(s, "")
	s = html.EscapeString(s)
	s = strings.TrimSpace(s)
	return s
}

// SanitizeName is like SanitizeString but also enforces length.
func SanitizeName(s string, maxLen int) string {
	s = SanitizeString(s)
	if utf8.RuneCountInString(s) > maxLen {
		runes := []rune(s)
		s = string(runes[:maxLen])
	}
	return s
}

// SanitizeComment strips tags and control chars but preserves newlines.
// Does NOT html-escape (comment may contain quotes etc that frontend handles).
func SanitizeComment(s string, maxLen int) string {
	s = htmlTagRegex.ReplaceAllString(s, "")
	s = controlRegex.ReplaceAllString(s, "")
	s = strings.TrimSpace(s)
	if utf8.RuneCountInString(s) > maxLen {
		runes := []rune(s)
		s = string(runes[:maxLen])
	}
	return s
}

// ValidateEmail checks format. Returns empty string if valid, error message if not.
func ValidateEmail(email string) string {
	if email == "" {
		return "" // email is optional in many places
	}
	email = strings.TrimSpace(email)
	if len(email) > 254 {
		return "Email занадто довгий"
	}
	if !emailRegex.MatchString(email) {
		return "Некоректний формат email"
	}
	return ""
}

// ValidatePhone checks Ukrainian phone format +380XXXXXXXXX.
func ValidatePhone(phone string) string {
	phone = strings.TrimSpace(phone)
	if phone == "" {
		return "Телефон обов'язковий"
	}
	// Remove spaces and dashes for validation
	cleaned := strings.NewReplacer(" ", "", "-", "", "(", "", ")", "").Replace(phone)
	if !phoneRegex.MatchString(cleaned) {
		return "Формат: +380XXXXXXXXX"
	}
	return ""
}

// ValidateName checks name length and content.
func ValidateName(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return "Ім'я обов'язкове"
	}
	if utf8.RuneCountInString(name) < 2 {
		return "Мінімум 2 символи"
	}
	if utf8.RuneCountInString(name) > 100 {
		return "Максимум 100 символів"
	}
	return ""
}