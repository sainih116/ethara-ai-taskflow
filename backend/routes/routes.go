package routes

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/teamtaskmanager/backend/config"
	"github.com/teamtaskmanager/backend/controllers"
	"github.com/teamtaskmanager/backend/middleware"
	ws "github.com/teamtaskmanager/backend/websocket"
)

// Setup configures all application routes
func Setup(router *gin.Engine, hub *ws.Hub) {
	cfg := config.AppConfig

	// CORS configuration
	corsConfig := cors.Config{
		AllowOrigins:     []string{cfg.FrontendURL, "http://localhost:5173", "http://localhost:5174", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "Accept"},
		ExposeHeaders:    []string{"Content-Length", "X-Total-Count"},
		AllowCredentials: true,
	}
	router.Use(cors.New(corsConfig))

	// Global middleware
	router.Use(middleware.Logger())
	router.Use(gin.Recovery())

	// Static files for uploads
	router.Static("/uploads", cfg.UploadPath)

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":      "ok",
			"service":     "Ethara AI TaskFlow API",
			"version":     "1.0.0",
			"environment": cfg.Environment,
		})
	})

	// WebSocket endpoint
	router.GET("/ws", ws.HandleWebSocket(hub))

	// Initialize controllers
	authCtrl := controllers.NewAuthController()
	projectCtrl := controllers.NewProjectController()
	taskCtrl := controllers.NewTaskController()
	userCtrl := controllers.NewUserController()

	// API v1 group
	api := router.Group("/api")
	api.Use(middleware.StandardRateLimiter())

	// Auth routes (public)
	auth := api.Group("/auth")
	auth.Use(middleware.StrictRateLimiter())
	{
		auth.POST("/register", authCtrl.Register)
		auth.POST("/login", authCtrl.Login)
		auth.GET("/me", middleware.AuthMiddleware(), authCtrl.GetMe)
		auth.PUT("/profile", middleware.AuthMiddleware(), authCtrl.UpdateProfile)
		auth.PUT("/change-password", middleware.AuthMiddleware(), authCtrl.ChangePassword)
	}

	// Protected routes
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware())
	{
		// Project routes
		projects := protected.Group("/projects")
		{
			projects.GET("", projectCtrl.GetAll)
			projects.POST("", middleware.AdminOnly(), projectCtrl.Create)
			projects.GET("/:id", projectCtrl.GetByID)
			projects.PUT("/:id", projectCtrl.Update)
			projects.DELETE("/:id", middleware.AdminOnly(), projectCtrl.Delete)
		}

		// Task routes
		tasks := protected.Group("/tasks")
		{
			tasks.GET("", taskCtrl.GetAll)
			tasks.POST("", middleware.AdminOnly(), taskCtrl.Create)
			tasks.GET("/:id", taskCtrl.GetByID)
			tasks.PUT("/:id", taskCtrl.Update)
			tasks.DELETE("/:id", taskCtrl.Delete)
			tasks.POST("/:id/comments", taskCtrl.AddComment)
		}

		// User routes (admin only for listing/creating/deleting)
		users := protected.Group("/users")
		{
			users.GET("", middleware.AdminOnly(), userCtrl.GetAll)
			users.POST("", middleware.AdminOnly(), userCtrl.Create)
			users.GET("/:id", userCtrl.GetByID)
			users.PUT("/:id", middleware.AdminOrSelf(), userCtrl.Update)
			users.DELETE("/:id", middleware.AdminOnly(), userCtrl.Delete)
		}

		// Dashboard analytics
		protected.GET("/dashboard/stats", taskCtrl.GetDashboardStats)
	}
}
