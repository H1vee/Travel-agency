package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"gopkg.in/yaml.v3"
)

type Config struct {
	Server   ServerConfig   `yaml:"server"`
	Database DatabaseConfig `yaml:"database"`
	JWT      JWTConfig      `yaml:"jwt"`
	App      AppConfig      `yaml:"app"`
}

type ServerConfig struct {
	Host string `yaml:"host"`
	Port string `yaml:"port"`
}

type DatabaseConfig struct {
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	User     string `yaml:"user"`
	Password string `yaml:"password"`
	DBName   string `yaml:"dbname"`
	SSLMode  string `yaml:"sslmode"`
}

type JWTConfig struct {
	Secret     string `yaml:"secret"`
	ExpiryHour int    `yaml:"expiry_hour"`
}

type AppConfig struct {
	Name        string `yaml:"name"`
	Version     string `yaml:"version"`
	Environment string `yaml:"environment"`
	Debug       bool   `yaml:"debug"`
}

var appConfig Config

func LoadConfig(configPath string) error {
	godotenv.Load()

	data, err := os.ReadFile(configPath)
	if err != nil {
		return err
	}

	err = yaml.Unmarshal(data, &appConfig)
	if err != nil {
		return err
	}

	if secret := os.Getenv("JWT_SECRET"); secret != "" {
		appConfig.JWT.Secret = secret
	}
	if password := os.Getenv("DB_PASSWORD"); password != "" {
		appConfig.Database.Password = password
	}

	if appConfig.JWT.Secret == "" {
		log.Fatal("JWT_SECRET is required! Set it in .env file or environment variable.")
	}

	log.Printf("Configuration loaded successfully from %s", configPath)
	log.Printf("Environment: %s", appConfig.App.Environment)
	log.Printf("Database: %s@%s:%d/%s",
		appConfig.Database.User,
		appConfig.Database.Host,
		appConfig.Database.Port,
		appConfig.Database.DBName)

	return nil
}

func GetConfig() Config {
	return appConfig
}
