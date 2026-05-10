package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/teamtaskmanager/backend/models"
	"github.com/teamtaskmanager/backend/services"
	"github.com/teamtaskmanager/backend/utils"
)

type AuthController struct {
	authService *services.AuthService
}

func NewAuthController() *AuthController {
	return &AuthController{
		authService: services.NewAuthService(),
	}
}

// Register godoc
// @Summary Register a new user
// @Tags auth
// @Accept json
// @Produce json
// @Param body body models.RegisterRequest true "Registration data"
// @Success 201 {object} utils.APIResponse
// @Router /api/auth/register [post]
func (c *AuthController) Register(ctx *gin.Context) {
	var req models.RegisterRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(ctx, err.Error())
		return
	}

	result, err := c.authService.Register(ctx.Request.Context(), &req)
	if err != nil {
		utils.BadRequest(ctx, err.Error())
		return
	}

	utils.Success(ctx, http.StatusCreated, "Registration successful", result)
}

// Login godoc
// @Summary Login user
// @Tags auth
// @Accept json
// @Produce json
// @Param body body models.LoginRequest true "Login credentials"
// @Success 200 {object} utils.APIResponse
// @Router /api/auth/login [post]
func (c *AuthController) Login(ctx *gin.Context) {
	var req models.LoginRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(ctx, err.Error())
		return
	}

	result, err := c.authService.Login(ctx.Request.Context(), &req)
	if err != nil {
		utils.Unauthorized(ctx, err.Error())
		return
	}

	utils.Success(ctx, http.StatusOK, "Login successful", result)
}

// GetMe godoc
// @Summary Get current user profile
// @Tags auth
// @Security BearerAuth
// @Produce json
// @Success 200 {object} utils.APIResponse
// @Router /api/auth/me [get]
func (c *AuthController) GetMe(ctx *gin.Context) {
	userID, _ := ctx.Get("userId")

	profile, err := c.authService.GetProfile(ctx.Request.Context(), userID.(string))
	if err != nil {
		utils.NotFound(ctx, err.Error())
		return
	}

	utils.Success(ctx, http.StatusOK, "Profile retrieved", profile)
}

// UpdateProfile godoc
// @Summary Update user profile
// @Tags auth
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body models.UpdateUserRequest true "Update data"
// @Success 200 {object} utils.APIResponse
// @Router /api/auth/profile [put]
func (c *AuthController) UpdateProfile(ctx *gin.Context) {
	userID, _ := ctx.Get("userId")

	var req models.UpdateUserRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(ctx, err.Error())
		return
	}

	profile, err := c.authService.UpdateProfile(ctx.Request.Context(), userID.(string), &req)
	if err != nil {
		utils.BadRequest(ctx, err.Error())
		return
	}

	utils.Success(ctx, http.StatusOK, "Profile updated", profile)
}

// ChangePassword godoc
// @Summary Change user password
// @Tags auth
// @Security BearerAuth
// @Accept json
// @Produce json
// @Success 200 {object} utils.APIResponse
// @Router /api/auth/change-password [put]
func (c *AuthController) ChangePassword(ctx *gin.Context) {
	userID, _ := ctx.Get("userId")

	var req struct {
		CurrentPassword string `json:"currentPassword" binding:"required"`
		NewPassword     string `json:"newPassword" binding:"required,min=8"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(ctx, err.Error())
		return
	}

	if err := c.authService.ChangePassword(ctx.Request.Context(), userID.(string), req.CurrentPassword, req.NewPassword); err != nil {
		utils.BadRequest(ctx, err.Error())
		return
	}

	utils.Success(ctx, http.StatusOK, "Password changed successfully", nil)
}

// ForgotPassword generates a reset token for the given email
func (c *AuthController) ForgotPassword(ctx *gin.Context) {
	var req models.ForgotPasswordRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(ctx, err.Error())
		return
	}

	token, err := c.authService.ForgotPassword(ctx.Request.Context(), req.Email)
	if err != nil {
		utils.InternalServerError(ctx, err.Error())
		return
	}

	// In production: send token via email
	// For this app: return token directly so frontend can use it
	utils.Success(ctx, http.StatusOK, "If this email exists, a reset token has been generated", gin.H{
		"resetToken": token,
	})
}

// ResetPassword sets a new password using a valid reset token
func (c *AuthController) ResetPassword(ctx *gin.Context) {
	var req models.ResetPasswordRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(ctx, err.Error())
		return
	}

	if err := c.authService.ResetPassword(ctx.Request.Context(), req.Token, req.NewPassword); err != nil {
		utils.BadRequest(ctx, err.Error())
		return
	}

	utils.Success(ctx, http.StatusOK, "Password reset successfully. Please log in with your new password.", nil)
}
