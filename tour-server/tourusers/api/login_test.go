package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
)

type testValidator struct {
	validator *validator.Validate
}

func (tv *testValidator) Validate(i interface{}) error {
	return tv.validator.Struct(i)
}

func setupUserEcho() *echo.Echo {
	e := echo.New()
	e.Validator = &testValidator{validator: validator.New()}
	return e
}

func TestLoginUser_EmptyBody(t *testing.T) {
	e := setupUserEcho()

	req := httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader("{}"))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	handler := LoginUser(nil)
	handler(c)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for empty body, got %d", rec.Code)
	}
}

func TestLoginUser_MissingPassword(t *testing.T) {
	e := setupUserEcho()

	body := `{"email": "test@example.com"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	handler := LoginUser(nil)
	handler(c)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for missing password, got %d", rec.Code)
	}
}

func TestLoginUser_InvalidEmail(t *testing.T) {
	e := setupUserEcho()

	body := `{"email": "not-an-email", "password": "123456"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	handler := LoginUser(nil)
	handler(c)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid email, got %d", rec.Code)
	}
}

func TestLoginUser_InvalidJSON(t *testing.T) {
	e := setupUserEcho()

	req := httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader("{broken"))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	handler := LoginUser(nil)
	handler(c)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid JSON, got %d", rec.Code)
	}

	var resp map[string]string
	json.Unmarshal(rec.Body.Bytes(), &resp)
	if resp["error"] == "" {
		t.Error("expected error message")
	}
}
