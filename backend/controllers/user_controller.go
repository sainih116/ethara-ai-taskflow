package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/teamtaskmanager/backend/models"
	"github.com/teamtaskmanager/backend/services"
	"github.com/teamtaskmanager/backend/utils"
)

type UserController struct {
	userService *services.UserService
}

func NewUserController() *UserController {
	return &UserController{
		userService: services.NewUserService(),
	}
}

// GetAll returns all users — admin only
func (c *UserController) GetAll(ctx *gin.Context) {
	pagination := utils.GetPagination(ctx)

	users, total, err := c.userService.GetAll(ctx.Request.Context(), pagination.Skip, pagination.Limit)
	if err != nil {
		utils.InternalServerError(ctx, err.Error())
		return
	}

	meta := &utils.Meta{
		Total: total,
		Page:  pagination.Page,
		Limit: pagination.Limit,
		Pages: utils.CalculatePages(total, pagination.Limit),
	}

	utils.SuccessWithMeta(ctx, http.StatusOK, "Users retrieved", users, meta)
}

// GetByID returns a single user
func (c *UserController) GetByID(ctx *gin.Context) {
	userID := ctx.Param("id")

	user, err := c.userService.GetByID(ctx.Request.Context(), userID)
	if err != nil {
		utils.NotFound(ctx, err.Error())
		return
	}

	utils.Success(ctx, http.StatusOK, "User retrieved", user)
}

// Update updates a user's profile — admin or self
func (c *UserController) Update(ctx *gin.Context) {
	userID := ctx.Param("id")

	var req models.UpdateUserRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(ctx, err.Error())
		return
	}

	user, err := c.userService.Update(ctx.Request.Context(), userID, &req)
	if err != nil {
		utils.BadRequest(ctx, err.Error())
		return
	}

	utils.Success(ctx, http.StatusOK, "User updated", user)
}

// Create allows an admin to create a new member account
func (c *UserController) Create(ctx *gin.Context) {
	var req models.CreateMemberRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(ctx, err.Error())
		return
	}

	user, err := c.userService.CreateMember(ctx.Request.Context(), &req)
	if err != nil {
		utils.BadRequest(ctx, err.Error())
		return
	}

	utils.Success(ctx, http.StatusCreated, "Member created successfully", user)
}

// Delete removes a user account — admin only
func (c *UserController) Delete(ctx *gin.Context) {
	userID := ctx.Param("id")

	// Prevent admin from deleting themselves
	selfID, _ := ctx.Get("userId")
	if selfID.(string) == userID {
		utils.BadRequest(ctx, "You cannot delete your own account")
		return
	}

	if err := c.userService.Delete(ctx.Request.Context(), userID); err != nil {
		utils.BadRequest(ctx, err.Error())
		return
	}

	utils.Success(ctx, http.StatusOK, "Member removed successfully", nil)
}
