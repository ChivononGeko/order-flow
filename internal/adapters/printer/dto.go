package printer

import (
	"encoding/json"
	"orderflow/internal/domain"
	"strconv"
	"time"
)

type Order struct {
	ClientName string         `json:"clientName"`
	CloseTime  string         `json:"closeTime"`
	Products   []OrderProduct `json:"products"`
}

type OrderProduct struct {
	Comment       string `json:"comment"`
	Count         int    `json:"count"`
	ID            string `json:"id"`
	Modifications string `json:"modifications"` // JSON string
}

type OrderModification struct {
	M int `json:"m"` // modification id
	A int `json:"a"` // amount
}

func ConvertToPrintableOrder(order domain.Order) (Order, error) {
	products := make([]OrderProduct, 0, len(order.Products))

	for _, p := range order.Products {
		mods := make([]OrderModification, 0, len(p.Modification))
		for _, mod := range p.Modification {
			mods = append(mods, OrderModification{
				M: mod.ID,
				A: mod.Count,
			})
		}

		modsJSON, err := json.Marshal(mods)
		if err != nil {
			return Order{}, err
		}

		products = append(products, OrderProduct{
			Comment:       p.Comment,
			Count:         int(p.Count),
			ID:            strconv.Itoa(p.ID),
			Modifications: string(modsJSON),
		})
	}

	return Order{
		ClientName: order.Comment,
		CloseTime:  time.Now().Format("2006-01-02 15:04:05"),
		Products:   products,
	}, nil
}
