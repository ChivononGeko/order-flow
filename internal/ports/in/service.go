package in

import "orderflow/internal/domain"

// OrderService определяет бизнес-логику заказов
type OrderService interface {
	ProcessOrder(order domain.Order) error
}
