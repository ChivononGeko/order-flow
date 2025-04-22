package printer

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"

	"orderflow/internal/domain"
)

type PrinterAdapter struct {
	URL string
}

func NewPrinterAdapter(url string) *PrinterAdapter {
	return &PrinterAdapter{URL: url}
}

func (a *PrinterAdapter) PrintOrder(order domain.Order) error {
	dto, err := ConvertToPrintableOrder(order)
	if err != nil {
		return fmt.Errorf("convert to printable order error: %w", err)
	}

	body, err := json.Marshal(dto)
	if err != nil {
		return fmt.Errorf("marshal error: %w", err)
	}

	req, err := http.NewRequest("POST", a.URL+"/order", bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("create request error: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("send request error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("printer server returned status: %d", resp.StatusCode)
	}

	return nil
}
