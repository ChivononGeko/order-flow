package poster

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"orderflow/internal/domain"
)

type OrderResponse struct {
	Response struct {
		OrderID int     `json:"id"`
		Sum     float64 `json:"sum"`
	} `json:"response"`
}

type PosterClient struct {
	token string
}

func NewPosterClient(token string) *PosterClient {
	return &PosterClient{token: token}
}

func (p *PosterClient) CreateOrder(order domain.Order) (int, float64, error) {
	url := fmt.Sprintf("https://joinposter.com/api/orders?token=%s", p.token)

	orderDTO := p.convertOrder(order)

	orderJSON, err := json.Marshal(orderDTO)
	if err != nil {
		return 0, 0, err
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(orderJSON))
	if err != nil {
		return 0, 0, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		return 0, 0, fmt.Errorf("ошибка: код %d, ответ: %s", resp.StatusCode, string(body))
	}

	var result OrderResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return 0, 0, err
	}

	return result.Response.OrderID, result.Response.Sum, nil
}

func (p *PosterClient) CloseTransaction(transactionID int, sum float64) error {
	url := fmt.Sprintf("https://joinposter.com/api/transactions.closeTransaction?token=%s", p.token)

	transaction := map[string]interface{}{
		"spot_id":        1,
		"spot_tablet_id": 1,
		"transaction_id": transactionID,
		"payed_card":     sum,
		"print_fiscal":   1,
	}

	slog.Info("transaction details", "transaction", transaction)

	jsonData, _ := json.Marshal(transaction)
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println("Ответ закрытия чека:", string(body))
	return nil
}

func (p *PosterClient) convertOrder(order domain.Order) OrderDTO {
	return OrderDTO{
		SpotID:      1,
		ServiceMode: 1,
		WaiterId:    29,
		AutoAccept:  true,
		Client: Client{
			ID:    1117,
			Phone: "+7 707 707 7070",
		},
		Comment:  order.Comment,
		Products: p.convertProducts(order.Products),
	}
}

func (p *PosterClient) convertProducts(products []domain.Product) []ProductDTO {
	var result []ProductDTO

	for _, product := range products {
		result = append(result, ProductDTO{
			ID:           product.ID,
			Count:        product.Count,
			Price:        product.Price,
			Comment:      product.Comment,
			Modification: p.convertModifications(product.Modification),
		})
	}

	return result
}

func (p *PosterClient) convertModifications(modifications []domain.Modification) []ModificationDTO {
	var result []ModificationDTO

	for _, modification := range modifications {
		result = append(result, ModificationDTO{
			ID:    modification.ID,
			Count: modification.Count,
		})
	}

	return result
}
