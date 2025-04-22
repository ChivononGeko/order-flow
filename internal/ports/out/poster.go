package out

import "orderflow/internal/domain"

type PosterPort interface {
	CreateOrder(order domain.Order) (int, float64, error)
	CloseTransaction(transactionID int, sum float64) error
}
