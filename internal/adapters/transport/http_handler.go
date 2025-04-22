package transport

import (
	"encoding/json"
	"fmt"
	"net/http"
	"orderflow/internal/domain"
	"orderflow/internal/ports/in"
	"orderflow/internal/ports/out"
)

type HTTPHandler struct {
	service in.OrderService
}

func NewHTTPHandler(service in.OrderService) out.OrderHandler {
	return &HTTPHandler{service: service}
}

func (h *HTTPHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	var order domain.Order
	if err := json.NewDecoder(r.Body).Decode(&order); err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.service.ProcessOrder(order); err != nil {
		fmt.Printf("Ошибка создания заказа: %v", err)
		respondWithError(w, http.StatusPaymentRequired, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"message":"Заказ успешно создан"}`))
}

func respondWithError(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)

	response := map[string]string{"error": message}
	json.NewEncoder(w).Encode(response)
}
