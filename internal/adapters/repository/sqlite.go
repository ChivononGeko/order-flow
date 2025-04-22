package repository

import (
	"database/sql"
	"fmt"
)

type SQLiteHistoryRepo struct {
	db *sql.DB
}

func NewSQLiteHistoryRepo(db *sql.DB) *SQLiteHistoryRepo {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS transactions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			transaction_id TEXT NOT NULL,
			amount REAL NOT NULL,
			comment TEXT,
			process_id TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		fmt.Printf("Ошибка при создании таблицы: %v\n", err)
	}

	return &SQLiteHistoryRepo{db: db}
}

func (r *SQLiteHistoryRepo) SaveTransaction(transactionID int, amount float64, comment, processID string) error {
	_, err := r.db.Exec(`
		INSERT INTO transactions (transaction_id, amount, comment, process_id)
		VALUES (?, ?, ?, ?)`, transactionID, amount, comment, processID)
	if err != nil {
		return fmt.Errorf("ошибка при сохранении транзакции: %w", err)
	}
	return nil
}
