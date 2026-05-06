package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"tour-server/bookings/dto"

	"github.com/labstack/echo/v4"
)

func setupEcho() *echo.Echo {
	e := echo.New()
	return e
}

func TestPostBookings_InvalidJSON(t *testing.T) {
	e := setupEcho()

	req := httptest.NewRequest(http.MethodPost, "/tour/bookings", strings.NewReader("{invalid}"))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	handler := PostBookings(nil)
	handler(c)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

func TestPostBookings_EmptyName(t *testing.T) {
	e := setupEcho()

	body := dto.BookingRequest{
		TourDateID:    1,
		CustomerName:  "",
		CustomerPhone: "+380951234567",
		Seats:         1,
	}
	jsonBody, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/tour/bookings", strings.NewReader(string(jsonBody)))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	handler := PostBookings(nil)
	handler(c)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}

	var resp map[string]string
	json.Unmarshal(rec.Body.Bytes(), &resp)
	if resp["error"] == "" {
		t.Error("expected error message for empty name")
	}
}

func TestPostBookings_InvalidPhone(t *testing.T) {
	e := setupEcho()

	body := dto.BookingRequest{
		TourDateID:    1,
		CustomerName:  "Артем",
		CustomerPhone: "12345",
		Seats:         1,
	}
	jsonBody, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/tour/bookings", strings.NewReader(string(jsonBody)))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	handler := PostBookings(nil)
	handler(c)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

func TestPostBookings_ZeroSeats(t *testing.T) {
	e := setupEcho()

	body := dto.BookingRequest{
		TourDateID:    1,
		CustomerName:  "Артем",
		CustomerPhone: "+380951234567",
		Seats:         0,
	}
	jsonBody, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/tour/bookings", strings.NewReader(string(jsonBody)))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	handler := PostBookings(nil)
	handler(c)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

func TestPostBookings_TooManySeats(t *testing.T) {
	e := setupEcho()

	body := dto.BookingRequest{
		TourDateID:    1,
		CustomerName:  "Артем",
		CustomerPhone: "+380951234567",
		Seats:         21,
	}
	jsonBody, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/tour/bookings", strings.NewReader(string(jsonBody)))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	handler := PostBookings(nil)
	handler(c)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

func TestPostBookings_ZeroTourDateID(t *testing.T) {
	e := setupEcho()

	body := dto.BookingRequest{
		TourDateID:    0,
		CustomerName:  "Артем",
		CustomerPhone: "+380951234567",
		Seats:         2,
	}
	jsonBody, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/tour/bookings", strings.NewReader(string(jsonBody)))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	handler := PostBookings(nil)
	handler(c)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

func TestPostBookings_InvalidEmail(t *testing.T) {
	e := setupEcho()

	body := dto.BookingRequest{
		TourDateID:    1,
		CustomerName:  "Артем",
		CustomerEmail: "not-an-email",
		CustomerPhone: "+380951234567",
		Seats:         1,
	}
	jsonBody, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/tour/bookings", strings.NewReader(string(jsonBody)))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	handler := PostBookings(nil)
	handler(c)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}
