package liqpay

import (
	"encoding/base64"
	"encoding/json"
	"testing"
)

func TestEncodeDecode(t *testing.T) {
	params := Params{
		"action":   "pay",
		"amount":   "100.00",
		"currency": "UAH",
		"order_id": "test-order-1",
	}

	encoded, err := Encode(params)
	if err != nil {
		t.Fatalf("Encode failed: %v", err)
	}

	if encoded == "" {
		t.Fatal("encoded string is empty")
	}

	decoded, err := Decode(encoded)
	if err != nil {
		t.Fatalf("Decode failed: %v", err)
	}

	if decoded["action"] != "pay" {
		t.Errorf("expected action=pay, got %v", decoded["action"])
	}
	if decoded["order_id"] != "test-order-1" {
		t.Errorf("expected order_id=test-order-1, got %v", decoded["order_id"])
	}
}

func TestSignAndVerify(t *testing.T) {
	privateKey := "test_private_key_sandbox"

	params := Params{
		"action":   "pay",
		"amount":   "500.00",
		"currency": "UAH",
		"order_id": "booking-42-1234567890",
	}

	data, err := Encode(params)
	if err != nil {
		t.Fatalf("Encode failed: %v", err)
	}

	signature := Sign(data, privateKey)

	if signature == "" {
		t.Fatal("signature is empty")
	}

	if !Verify(data, signature, privateKey) {
		t.Error("Verify returned false for valid signature")
	}
}

func TestVerifyRejectsTamperedData(t *testing.T) {
	privateKey := "test_private_key_sandbox"

	params := Params{
		"action":   "pay",
		"amount":   "500.00",
		"currency": "UAH",
		"order_id": "booking-42",
	}

	data, _ := Encode(params)
	signature := Sign(data, privateKey)

	tampered := Params{
		"action":   "pay",
		"amount":   "1.00",
		"currency": "UAH",
		"order_id": "booking-42",
	}
	tamperedData, _ := Encode(tampered)

	if Verify(tamperedData, signature, privateKey) {
		t.Error("Verify should reject tampered data")
	}
}

func TestVerifyRejectsWrongKey(t *testing.T) {
	data, _ := Encode(Params{"action": "pay", "amount": "100"})
	signature := Sign(data, "correct_key")

	if Verify(data, signature, "wrong_key") {
		t.Error("Verify should reject wrong private key")
	}
}

func TestDecodeInvalidBase64(t *testing.T) {
	_, err := Decode("not-valid-base64!!!")
	if err == nil {
		t.Error("expected error for invalid base64")
	}
}

func TestDecodeValidBase64InvalidJSON(t *testing.T) {
	encoded := base64.StdEncoding.EncodeToString([]byte("not json"))
	_, err := Decode(encoded)
	if err == nil {
		t.Error("expected error for invalid JSON")
	}
}

func TestEncodeProducesValidBase64JSON(t *testing.T) {
	params := Params{"key": "value"}
	encoded, err := Encode(params)
	if err != nil {
		t.Fatalf("Encode failed: %v", err)
	}

	raw, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		t.Fatalf("not valid base64: %v", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(raw, &result); err != nil {
		t.Fatalf("not valid JSON: %v", err)
	}
}
