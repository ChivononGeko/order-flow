// internal/config/config.go

package config

import (
	"log"
	"os"
)

type Config struct {
	Port           string
	DBPath         string
	PosterToken    string
	PaymentAddress string
}

var AppConfig Config

func Load() {
	AppConfig = Config{
		Port:           getEnv("PORT", "8081"),
		DBPath:         getEnv("DB_PATH", "./orderflow.db"),
		PosterToken:    getEnv("POSTER_TOKEN", ""),
		PaymentAddress: getEnv("PAYMENT_ADDRESS", ""),
	}
}

func getEnv(key, defaultVal string) string {
	val := os.Getenv(key)
	if val == "" {
		if defaultVal == "" {
			log.Fatalf("env variable %s is required", key)
		}
		return defaultVal
	}
	return val
}
