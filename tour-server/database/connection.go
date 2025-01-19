package database

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	_ "github.com/lib/pq"
)

var DB *gorm.DB

const (
	host     = "localhost"
	port     = 5432
	user     = "postgres"
	password = "your_password"
	dbname   = "postgres"
)

func InitDB() {
	var err error
	var connStr = fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)

	// Ініціалізуємо глобальну змінну DB
	DB, err = gorm.Open(postgres.Open(connStr), &gorm.Config{})
	if err != nil {
		log.Fatalf("Couldn't open database: %v", err)
	}

	sqlDB, err := DB.DB()
	if err != nil {
		log.Fatalf("Couldn't get DB object: %v", err)
	}

	err = sqlDB.Ping()
	if err != nil {
		log.Fatalf("Couldn't ping database: %v", err)
	}

	fmt.Println("Successfully connected to the database")
}
