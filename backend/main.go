package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/teamtaskmanager/backend/config"
	"github.com/teamtaskmanager/backend/database"
	"github.com/teamtaskmanager/backend/routes"
	ws "github.com/teamtaskmanager/backend/websocket"
)

func main() {
	// ── Configuration ──────────────────────────────────────────────────────
	cfg := config.Load()

	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// ── Database ───────────────────────────────────────────────────────────
	database.Connect()
	defer database.Disconnect()

	// ── WebSocket Hub ──────────────────────────────────────────────────────
	hub := ws.NewHub()
	ws.GlobalHub = hub
	go hub.Run()

	// ── Router ─────────────────────────────────────────────────────────────
	router := gin.New()
	routes.Setup(router, hub)

	// ── HTTP Server ────────────────────────────────────────────────────────
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
		log.Println("  🏢  Ethara AI TaskFlow — Enterprise Backend")
		log.Printf("  🚀  API running on http://localhost:%s", cfg.Port)
		log.Printf("  🌐  Frontend origin  : %s", cfg.FrontendURL)
		log.Printf("  🗄️   Database         : %s", cfg.DBName)
		log.Printf("  ⚙️   Environment      : %s", cfg.Environment)
		log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("❌  Server failed: %v", err)
		}
	}()

	// ── Graceful Shutdown ──────────────────────────────────────────────────
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("⏳  Shutting down server gracefully…")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("❌  Forced shutdown: %v", err)
	}
	log.Println("✅  Server exited cleanly")
}
