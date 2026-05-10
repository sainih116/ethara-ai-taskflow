package websocket

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/teamtaskmanager/backend/utils"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// In production, validate the origin against allowed domains
		return true
	},
}

// HandleWebSocket upgrades HTTP connection to WebSocket
func HandleWebSocket(hub *Hub) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Validate token from query param (WebSocket doesn't support headers easily)
		token := c.Query("token")
		if token == "" {
			utils.Unauthorized(c, "Token required")
			return
		}

		claims, err := utils.ValidateToken(token)
		if err != nil {
			utils.Unauthorized(c, "Invalid token")
			return
		}

		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			return
		}

		client := &Client{
			ID:     claims.UserID + "-" + c.ClientIP(),
			UserID: claims.UserID,
			Conn:   conn,
			Send:   make(chan []byte, 256),
			Hub:    hub,
			Rooms:  make(map[string]bool),
		}

		hub.register <- client

		// Send welcome message
		welcomeMsg := Message{
			Type:    "connected",
			Payload: map[string]string{"userId": claims.UserID, "message": "Connected to Team Task Manager"},
		}
		if data, err := json.Marshal(welcomeMsg); err == nil {
			client.Send <- data
		}

		go client.writePump()
		go client.readPump()
	}
}
