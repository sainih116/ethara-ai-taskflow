package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config holds all application configuration
type Config struct {
	Port               string
	MongoURI           string
	DBName             string
	JWTSecret          string
	JWTExpiry          string
	RefreshTokenExpiry string
	Environment        string
	FrontendURL        string
	MaxFileSize        int64
	UploadPath         string
}

var AppConfig *Config

// Load initializes configuration from environment variables
func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	maxFileSize, err := strconv.ParseInt(getEnv("MAX_FILE_SIZE", "10485760"), 10, 64)
	if err != nil {
		maxFileSize = 10485760
	}

	AppConfig = &Config{
		Port:               getEnv("PORT", "8080"),
		MongoURI:           getEnv("MONGODB_URI", "mongodb://localhost:27017"),
		DBName:             getEnv("DB_NAME", "ethara_ai_taskflow"),
		JWTSecret:          getEnv("JWT_SECRET", "ethara-ai-fallback-secret"),
		JWTExpiry:          getEnv("JWT_EXPIRY", "24h"),
		RefreshTokenExpiry: getEnv("REFRESH_TOKEN_EXPIRY", "168h"),
		Environment:        getEnv("ENVIRONMENT", "development"),
		FrontendURL:        getEnv("FRONTEND_URL", "http://localhost:5173"),
		MaxFileSize:        maxFileSize,
		UploadPath:         getEnv("UPLOAD_PATH", "./uploads"),
	}

	return AppConfig
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
