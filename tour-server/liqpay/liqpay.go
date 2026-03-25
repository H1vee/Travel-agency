package liqpay

import (
	"crypto/sha1"
	"encoding/base64"
	"encoding/json"
	"fmt"
)

// Params is a map of LiqPay request fields.
type Params map[string]interface{}

// Sign returns base64( SHA1( privateKey + data + privateKey ) )
func Sign(data, privateKey string) string {
	h := sha1.New()
	h.Write([]byte(privateKey + data + privateKey))
	return base64.StdEncoding.EncodeToString(h.Sum(nil))
}

// Encode converts params map → base64 JSON string (the "data" field).
func Encode(params Params) (string, error) {
	b, err := json.Marshal(params)
	if err != nil {
		return "", fmt.Errorf("liqpay encode: %w", err)
	}
	return base64.StdEncoding.EncodeToString(b), nil
}

// Decode decodes a base64 "data" string back to a map.
func Decode(data string) (map[string]interface{}, error) {
	b, err := base64.StdEncoding.DecodeString(data)
	if err != nil {
		return nil, fmt.Errorf("liqpay decode: %w", err)
	}
	var out map[string]interface{}
	if err := json.Unmarshal(b, &out); err != nil {
		return nil, fmt.Errorf("liqpay unmarshal: %w", err)
	}
	return out, nil
}

// Verify checks that received signature matches expected.
func Verify(data, signature, privateKey string) bool {
	return Sign(data, privateKey) == signature
}