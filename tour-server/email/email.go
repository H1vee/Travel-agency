package email

import (
	"bytes"
	"fmt"
	"html/template"
	"log"
	"net/smtp"
	"strings"
)

type SMTPConfig struct {
	Host     string
	Port     int
	User     string // Gmail address
	Password string // App password 
	From     string // Display name + address
}

var config *SMTPConfig

// Init sets the SMTP configuration. Call once at startup.
func Init(cfg SMTPConfig) {
	if cfg.From == "" {
		cfg.From = cfg.User
	}
	config = &cfg
	log.Printf("Email service initialized: %s via %s:%d", cfg.From, cfg.Host, cfg.Port)
}

// IsConfigured returns true if email service has been initialized.
func IsConfigured() bool {
	return config != nil && config.User != "" && config.Password != ""
}

// Send sends an HTML email. Returns error but never panics —
// callers should log errors but not fail the main operation.
func Send(to, subject, htmlBody string) error {
	if !IsConfigured() {
		return fmt.Errorf("email: not configured, skipping send to %s", to)
	}

	if to == "" {
		return fmt.Errorf("email: empty recipient")
	}

	addr := fmt.Sprintf("%s:%d", config.Host, config.Port)
	auth := smtp.PlainAuth("", config.User, config.Password, config.Host)

	headers := map[string]string{
		"From":         config.From,
		"To":           to,
		"Subject":      subject,
		"MIME-Version": "1.0",
		"Content-Type": "text/html; charset=\"UTF-8\"",
	}

	var msg bytes.Buffer
	for k, v := range headers {
		fmt.Fprintf(&msg, "%s: %s\r\n", k, v)
	}
	msg.WriteString("\r\n")
	msg.WriteString(htmlBody)

	err := smtp.SendMail(addr, auth, config.User, []string{to}, msg.Bytes())
	if err != nil {
		return fmt.Errorf("email: send to %s failed: %w", to, err)
	}

	log.Printf("Email sent to %s: %s", to, subject)
	return nil
}

// SendAsync sends email in a goroutine — fire and forget with logging.
func SendAsync(to, subject, htmlBody string) {
	go func() {
		if err := Send(to, subject, htmlBody); err != nil {
			log.Printf("Email error: %v", err)
		}
	}()
}

// renderTemplate parses and executes a Go html/template string.
func renderTemplate(tmplStr string, data interface{}) (string, error) {
	tmpl, err := template.New("email").Parse(tmplStr)
	if err != nil {
		return "", fmt.Errorf("email template parse: %w", err)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("email template exec: %w", err)
	}

	return buf.String(), nil
}

func formatPrice(amount float64) string {
	s := fmt.Sprintf("%.2f", amount)
	parts := strings.Split(s, ".")
	intPart := parts[0]
	decPart := parts[1]

	var result []byte
	for i, c := range intPart {
		if i > 0 && (len(intPart)-i)%3 == 0 {
			result = append(result, ' ')
		}
		result = append(result, byte(c))
	}

	return string(result) + "." + decPart + " ₴"
}