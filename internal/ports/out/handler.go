package out

import "net/http"

type OrderHandler interface {
	CreateOrder(w http.ResponseWriter, r *http.Request)
}
