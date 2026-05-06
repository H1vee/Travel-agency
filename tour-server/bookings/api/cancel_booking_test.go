package api

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
)

func TestCancelBooking_InvalidID(t *testing.T) {
	e := echo.New()

	req := httptest.NewRequest(http.MethodPut, "/bookings/abc/cancel", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues("abc")
	c.Set("user_id", uint(1))

	handler := CancelBooking(nil)
	handler(c)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

func TestCancelBooking_ZeroID(t *testing.T) {
	e := echo.New()

	req := httptest.NewRequest(http.MethodPut, "/bookings/0/cancel", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues("0")
	c.Set("user_id", uint(1))

	handler := CancelBooking(nil)
	handler(c)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

func TestCancelBooking_NegativeID(t *testing.T) {
	e := echo.New()

	req := httptest.NewRequest(http.MethodPut, "/bookings/-5/cancel", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues("-5")
	c.Set("user_id", uint(1))

	handler := CancelBooking(nil)
	handler(c)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

func TestCancelBooking_NoUserID(t *testing.T) {
	e := echo.New()

	req := httptest.NewRequest(http.MethodPut, "/bookings/1/cancel", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues("1")

	handler := CancelBooking(nil)
	handler(c)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
}