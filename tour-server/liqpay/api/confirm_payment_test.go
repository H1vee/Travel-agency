package api

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
)

// TestConfirmPayment_MissingData verifies that the handler rejects requests
// without an order_id field. confirm now identifies a payment by its order_id
// alone — the legacy data+signature pair is no longer accepted.
func TestConfirmPayment_MissingData(t *testing.T) {
	e := echo.New()

	body := `{}`
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

// TestConfirmPayment_InvalidJSON verifies that the handler rejects requests
// with a malformed JSON body before any LiqPay interaction is attempted.
func TestConfirmPayment_InvalidJSON(t *testing.T) {
	e := echo.New()

	body := `{not a json`
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
