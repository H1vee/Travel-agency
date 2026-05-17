package database

import (
	"fmt"
	"log"
	"tour-server/config"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	_ "github.com/lib/pq"
)

var DB *gorm.DB

func InitDB() {
	cfg := config.GetConfig()

	var connStr = fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.DBName,
		cfg.Database.SSLMode)

	var err error
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

	log.Printf("Successfully connected to database: %s@%s:%d/%s",
		cfg.Database.User,
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.DBName)
}
