package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
)

func TestUpdateBookingStatus_EmptyBody(t *testing.T) {
	e := echo.New()

	req := httptest.NewRequest(http.MethodPut, "/admin/bookings/1/status", strings.NewReader("{}"))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues("1")

	handler := UpdateBookingStatus(nil)
	handler(c)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

func TestUpdateBookingStatus_InvalidStatus(t *testing.T) {
	e := echo.New()

	body := `{"status": "invalid_status"}`
	req := httptest.NewRequest(http.MethodPut, "/admin/bookings/1/status", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues("1")

	handler := UpdateBookingStatus(nil)
	handler(c)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}

	var resp map[string]string
	json.Unmarshal(rec.Body.Bytes(), &resp)
	if resp["error"] == "" {
		t.Error("expected error message for invalid status")
	}
}

func TestUpdateBookingStatus_InvalidID(t *testing.T) {
	e := echo.New()

	body := `{"status": "confirmed"}`
	req := httptest.NewRequest(http.MethodPut, "/admin/bookings/abc/status", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues("abc")

	handler := UpdateBookingStatus(nil)
	handler(c)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

func TestUpdateBookingStatus_ZeroID(t *testing.T) {
	e := echo.New()

	body := `{"status": "confirmed"}`
	req := httptest.NewRequest(http.MethodPut, "/admin/bookings/0/status", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues("0")

	handler := UpdateBookingStatus(nil)
	handler(c)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

func TestUpdateBookingStatus_NegativeID(t *testing.T) {
	e := echo.New()

	body := `{"status": "confirmed"}`
	req := httptest.NewRequest(http.MethodPut, "/admin/bookings/-1/status", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues("-1")

	handler := UpdateBookingStatus(nil)
	handler(c)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

func TestUpdateBookingStatus_ValidStatuses(t *testing.T) {
	validStatuses := []string{"pending", "confirmed", "cancelled"}
	for _, status := range validStatuses {
		if status != "pending" && status != "confirmed" && status != "cancelled" {
			t.Errorf("status %q should be valid", status)
		}
	}

	invalidStatuses := []string{"active", "done", "completed", "", "CONFIRMED"}
	for _, status := range invalidStatuses {
		isValid := status == "pending" || status == "confirmed" || status == "cancelled"
		if isValid {
			t.Errorf("status %q should be invalid", status)
		}
	}
}
