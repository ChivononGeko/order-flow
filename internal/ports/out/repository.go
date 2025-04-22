package out

type TransactionHistoryPort interface {
	SaveTransaction(transactionID int, amount float64, comment, processID string) error
}
