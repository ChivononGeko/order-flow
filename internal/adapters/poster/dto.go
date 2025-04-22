package poster

type OrderDTO struct {
	SpotID      int          `json:"spotId"`
	ServiceMode int          `json:"serviceMode"`
	AutoAccept  bool         `json:"autoAccept"`
	WaiterId    int          `json:"waiterId"`
	Client      Client       `json:"client"`
	Comment     string       `json:"comment"`
	Products    []ProductDTO `json:"products"`
	Payment     PaymentDTO
}

type PaymentDTO struct {
	Amount   float64
	Currency string
	Status   string
}

type Client struct {
	ID    int    `json:"id,omitempty"`
	Phone string `json:"phone"`
}

type ProductDTO struct {
	ID            int               `json:"id"`
	Count         float64           `json:"count"`
	Price         float64           `json:"price,omitempty"`
	Comment       string            `json:"comment,omitempty"`
	ModificatorID int               `json:"modificatorId,omitempty"`
	Modification  []ModificationDTO `json:"modification,omitempty"`
}

type ModificationDTO struct {
	ID    int `json:"id"`
	Count int `json:"count"`
}
