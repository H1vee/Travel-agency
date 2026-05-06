package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
)

func TestConfirmPayment_MissingData(t *testing.T) {
	e := echo.New()

	body := `{"data": "", "signature": ""}`
	req := httptest.NewRequest(http.MethodPost, "/liqpay/confirm", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	handler := ConfirmPayment(nil)
	handler(c)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

func TestConfirmPayment_InvalidSignature(t *testing.T) {
	e := echo.New()

	t.Setenv("LIQPAY_PRIVATE_KEY", "test_key")

	body := `{"data": "eyJhY3Rpb24iOiJwYXkifQ==", "signature": "invalid_sig"}`
	req := httptest.NewRequest(http.MethodPost, "/liqpay/confirm", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	handler := ConfirmPayment(nil)
	handler(c)

	if rec.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", rec.Code)
	}

	var resp map[string]string
	json.Unmarshal(rec.Body.Bytes(), &resp)
	if resp["error"] != "invalid signature" {
		t.Errorf("expected 'invalid signature', got %q", resp["error"])
	}
}
