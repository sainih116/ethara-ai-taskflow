package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/teamtaskmanager/backend/utils"
)

// AuthMiddleware validates JWT tokens on protected routes
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.Unauthorized(c, "Authorization header is required")
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			utils.Unauthorized(c, "Invalid authorization header format. Use: Bearer <token>")
			c.Abort()
			return
		}

		tokenString := parts[1]
		claims, err := utils.ValidateToken(tokenString)
		if err != nil {
			utils.Unauthorized(c, "Invalid or expired token")
			c.Abort()
			return
		}

		// Store user info in context for downstream handlers
		c.Set("userId", claims.UserID)
		c.Set("userEmail", claims.Email)
		c.Set("userRole", claims.Role)

		c.Next()
	}
}

// AdminOnly restricts access to admin users only
func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("userRole")
		if !exists {
			utils.Unauthorized(c, "Authentication required")
			c.Abort()
			return
		}

		if role != "admin" {
			utils.Forbidden(c, "Admin access required")
			c.Abort()
			return
		}

		c.Next()
	}
}

// AdminOrSelf allows admins or the user themselves to access the route
func AdminOrSelf() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := c.Get("userRole")
		userID, _ := c.Get("userId")
		paramID := c.Param("id")

		if role != "admin" && userID != paramID {
			utils.Forbidden(c, "Access denied")
			c.Abort()
			return
		}

		c.Next()
	}
}
