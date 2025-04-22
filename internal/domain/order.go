package domain

type Order struct {
	Comment  string
	Total    int
	Products []Product
}

type Product struct {
	ID           int
	Count        float64
	Comment      string
	Price        float64
	Modification []Modification
	Payment      PaymentInfo
}

type Modification struct {
	ID    int
	Count int
}

type PaymentInfo struct {
	Amount   float64
	Currency string
	Status   string
}
