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

	var connStr string = fmt.Sprintf("host=%s port=%d user=%s "+
		"password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)
	DB, err := gorm.Open(postgres.Open(connStr), &gorm.Config{})
	if err != nil {
		log.Fatalf("Couldn't ping database: %v", err)
	}
	sqlDB, err := DB.DB()
	if err != nil {
		log.Fatalf("Couldn't get DB object: %v", err)
	}

	err = sqlDB.Ping()
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Successfully connected to the database")
}
