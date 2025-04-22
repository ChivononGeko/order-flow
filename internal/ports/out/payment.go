package out

type PaymentPort interface {
	ProcessPayment(amount int) (string, error)
	CheckPaymentStatus(paymentID string) (string, error)
}
