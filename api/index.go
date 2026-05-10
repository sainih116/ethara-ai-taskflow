package handler

import (
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/teamtaskmanager/backend/config"
	"github.com/teamtaskmanager/backend/database"
	"github.com/teamtaskmanager/backend/routes"
	ws "github.com/teamtaskmanager/backend/websocket"
)

var (
	router *gin.Engine
	once   sync.Once
)

func init() {
	gin.SetMode(gin.ReleaseMode)
}

func getRouter() *gin.Engine {
	once.Do(func() {
		config.Load()
		database.Connect()

		hub := ws.NewHub()
		ws.GlobalHub = hub
		go hub.Run()

		router = gin.New()
		routes.Setup(router, hub)
	})
	return router
}

// Handler is the Vercel serverless entry point
func Handler(w http.ResponseWriter, r *http.Request) {
	getRouter().ServeHTTP(w, r)
}
