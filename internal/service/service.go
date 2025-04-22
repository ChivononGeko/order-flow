package service

import (
	"errors"
	"fmt"
	"orderflow/internal/domain"
	"orderflow/internal/ports/in"
	"orderflow/internal/ports/out"
	"time"
)

type OrderServiceImpl struct {
	posterAPI   out.PosterPort
	paymentAPI  out.PaymentPort
	printer     out.PrinterPort
	historyRepo out.TransactionHistoryPort
}

func NewOrderService(posterAPI out.PosterPort, paymentAPI out.PaymentPort, historyRepo out.TransactionHistoryPort, printer out.PrinterPort) in.OrderService {
	return &OrderServiceImpl{
		posterAPI:   posterAPI,
		paymentAPI:  paymentAPI,
		printer:     printer,
		historyRepo: historyRepo,
	}
}

func (s *OrderServiceImpl) ProcessOrder(order domain.Order) error {
	fmt.Printf("Processing order: %+v\n", order)

	if order.Comment == "" {
		return errors.New("invalid order: comment is required")
	}

	// 1. Отправляем сумму на Kaspi-терминал
	processID, err := s.paymentAPI.ProcessPayment(order.Total)
	if err != nil {
		return fmt.Errorf("ошибка при отправке платежа на терминал: %w", err)
	}

	fmt.Println("Ожидаем подтверждения оплаты...")

	// 2. Проверяем статус платежа (можно сделать задержку перед проверкой)
	time.Sleep(5 * time.Second)

	status, err := s.paymentAPI.CheckPaymentStatus(processID)
	if err != nil {
		return fmt.Errorf("ошибка при проверке статуса платежа: %w", err)
	}

	if status != "success" {
		return errors.New("платеж не был подтвержден")
	}

	//3. Создаем заказ в Poster
	transactionID, transactionAmount, err := s.posterAPI.CreateOrder(order)
	if err != nil {
		fmt.Println("Ошибка на создании заказа в постере")
		return err
	}

	if err := s.historyRepo.SaveTransaction(transactionID, transactionAmount, order.Comment, processID); err != nil {
		fmt.Println("Не удалось сохранить историю транзакции:", err)
	}

	// 4. Закрываем заказ в Poster
	if err := s.posterAPI.CloseTransaction(transactionID, transactionAmount); err != nil {
		return err
	}

	if err := s.printer.PrintOrder(order); err != nil {
		fmt.Println("Ошибка печати заказа:", err)
		return err
	}

	fmt.Println("Заказ успешно обработан и оплачен.")
	return nil
}
