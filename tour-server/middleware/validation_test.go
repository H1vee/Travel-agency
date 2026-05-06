package middleware

import (
	"testing"
)

func TestValidateEmail(t *testing.T) {
	tests := []struct {
		name  string
		email string
		valid bool
	}{
		{"valid email", "user@example.com", true},
		{"empty email", "", true},
		{"no @", "userexample.com", false},
		{"no domain", "user@", false},
		{"no tld", "user@example", false},
		{"special chars", "user+tag@example.com", true},
		{"too long", string(make([]byte, 255)) + "@test.com", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ValidateEmail(tt.email)
			if tt.valid && result != "" {
				t.Errorf("expected valid, got error: %s", result)
			}
			if !tt.valid && result == "" {
				t.Errorf("expected error for email %q", tt.email)
			}
		})
	}
}

func TestValidatePhone(t *testing.T) {
	tests := []struct {
		name  string
		phone string
		valid bool
	}{
		{"valid", "+380951234567", true},
		{"with spaces", "+380 95 123 45 67", true},
		{"empty", "", false},
		{"no prefix", "0951234567", false},
		{"short", "+38095123", false},
		{"too long", "+3809512345678", false},
		{"wrong country", "+490951234567", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ValidatePhone(tt.phone)
			if tt.valid && result != "" {
				t.Errorf("expected valid, got error: %s", result)
			}
			if !tt.valid && result == "" {
				t.Errorf("expected error for phone %q", tt.phone)
			}
		})
	}
}

func TestValidateName(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		valid   bool
	}{
		{"valid name", "Артем", true},
		{"empty", "", false},
		{"one char", "A", false},
		{"two chars", "AB", true},
		{"max length", string(make([]rune, 100)), true},
		{"over max", string(make([]rune, 101)), false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ValidateName(tt.input)
			if tt.valid && result != "" {
				t.Errorf("expected valid, got error: %s", result)
			}
			if !tt.valid && result == "" {
				t.Errorf("expected error for name %q", tt.input)
			}
		})
	}
}

func TestSanitizeName(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		maxLen   int
		expected string
	}{
		{"normal", "Артем", 100, "Артем"},
		{"html tags", "<script>alert('xss')</script>Артем", 100, "alert(&#39;xss&#39;)Артем"},
		{"trim spaces", "  Артем  ", 100, "Артем"},
		{"truncate", "Артем Лединський", 5, "Артем"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := SanitizeName(tt.input, tt.maxLen)
			if result != tt.expected {
				t.Errorf("expected %q, got %q", tt.expected, result)
			}
		})
	}
}
