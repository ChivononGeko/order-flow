package out

import "orderflow/internal/domain"

type PrinterPort interface {
	PrintOrder(order domain.Order) error
}
