package payment

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"
)

const (
	maxAttempts  = 180
	pollInterval = 1 * time.Second
)

type KaspiTerminalService struct {
	address string
}

func NewKaspiTerminalService(address string) *KaspiTerminalService {
	return &KaspiTerminalService{address: address}
}

type PaymentRequest struct {
	Amount float64 `json:"amount"`
}

type PaymentResponse struct {
	ProcessId string `json:"processId"`
}

type PaymentStatusResponse struct {
	Status string `json:"status"`
}

func (s *KaspiTerminalService) ProcessPayment(amount int) (string, error) {
	url := fmt.Sprintf("%s/payment?amount=%d", s.address, amount)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", err
	}

	client := &http.Client{Timeout: 3 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", errors.New("ошибка при отправке платежа в терминал")
	}

	var response PaymentResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return "", err
	}

	return response.ProcessId, nil
}

func (s *KaspiTerminalService) CheckPaymentStatus(transactionID string) (string, error) {
	url := fmt.Sprintf("%s/status?processId=%s", s.address, transactionID)

	client := &http.Client{Timeout: 1 * time.Second}

	for attempt := 1; attempt <= maxAttempts; attempt++ {
		req, err := http.NewRequest("GET", url, nil)
		if err != nil {
			return "", err
		}

		resp, err := client.Do(req)
		if err != nil {
			return "", err
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			return "", errors.New("ошибка при получении статуса платежа")
		}

		var response PaymentStatusResponse
		if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
			return "", err
		}

		if response.Status == "success" {
			return "success", nil
		} else if response.Status == "fail" {
			return "canceled", nil
		}

		fmt.Printf("⏳ Попытка %d/%d: статус платежа — %s. Ожидание %s...\n", attempt, maxAttempts, response.Status, pollInterval)
		time.Sleep(pollInterval)
	}

	return "", errors.New("тайм-аут: превышено время ожидания подтверждения платежа")
}
