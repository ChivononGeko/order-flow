package server

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"

	"orderflow/internal/adapters/payment"
	"orderflow/internal/adapters/poster"
	"orderflow/internal/adapters/printer"
	"orderflow/internal/adapters/repository"
	"orderflow/internal/adapters/transport"
	"orderflow/internal/config"
	"orderflow/internal/service"

	"github.com/joho/godotenv"
	_ "modernc.org/sqlite"
)

func Start() {
	_ = godotenv.Load()
	config.Load()

	db, err := sql.Open("sqlite", config.AppConfig.DBPath)
	if err != nil {
		log.Fatal(err)
	}

	posterClient := poster.NewPosterClient(config.AppConfig.PosterToken)
	paymentService := payment.NewKaspiTerminalService(config.AppConfig.PaymentAddress)
	historyRepo := repository.NewSQLiteHistoryRepo(db)
	printer := printer.NewPrinterAdapter("http://localhost:52123")

	orderService := service.NewOrderService(posterClient, paymentService, historyRepo, printer)

	handler := transport.NewHTTPHandler(orderService)
	router := transport.NewRouter(handler)

	addr := ":" + config.AppConfig.Port
	fmt.Println("Server is running on", addr)
	log.Fatal(http.ListenAndServe(addr, router))
}
