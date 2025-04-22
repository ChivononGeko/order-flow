package transport

import (
	"net/http"
	"orderflow/internal/ports/out"

	"github.com/go-chi/chi/v5"
)

func NewRouter(handler out.OrderHandler) *chi.Mux {
	r := chi.NewRouter()
	r.Post("/orders", handler.CreateOrder)
	fs := http.FileServer(http.Dir("web"))
	r.Handle("/*", fs)
	return r
}
