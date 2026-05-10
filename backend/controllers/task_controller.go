package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/teamtaskmanager/backend/models"
	"github.com/teamtaskmanager/backend/repositories"
	"github.com/teamtaskmanager/backend/services"
	"github.com/teamtaskmanager/backend/utils"
)

type TaskController struct {
	taskService *services.TaskService
}

func NewTaskController() *TaskController {
	return &TaskController{
		taskService: services.NewTaskService(),
	}
}

func (c *TaskController) Create(ctx *gin.Context) {
	userID, _ := ctx.Get("userId")

	var req models.CreateTaskRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(ctx, err.Error())
		return
	}

	task, err := c.taskService.Create(ctx.Request.Context(), &req, userID.(string))
	if err != nil {
		utils.BadRequest(ctx, err.Error())
		return
	}

	utils.Success(ctx, http.StatusCreated, "Task created successfully", task)
}

func (c *TaskController) GetAll(ctx *gin.Context) {
	userID, _ := ctx.Get("userId")
	role, _ := ctx.Get("userRole")

	pagination := utils.GetPagination(ctx)

	filter := repositories.TaskFilter{
		ProjectID:  ctx.Query("projectId"),
		AssignedTo: ctx.Query("assignedTo"),
		Status:     ctx.Query("status"),
		Priority:   ctx.Query("priority"),
		Search:     ctx.Query("search"),
	}

	tasks, total, err := c.taskService.GetAll(
		ctx.Request.Context(),
		userID.(string),
		role.(string),
		filter,
		pagination.Skip,
		pagination.Limit,
	)
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

	utils.SuccessWithMeta(ctx, http.StatusOK, "Tasks retrieved", tasks, meta)
}

func (c *TaskController) GetByID(ctx *gin.Context) {
	userID, _ := ctx.Get("userId")
	role, _ := ctx.Get("userRole")
	taskID := ctx.Param("id")

	task, err := c.taskService.GetByID(ctx.Request.Context(), taskID, userID.(string), role.(string))
	if err != nil {
		if err.Error() == "task not found" {
			utils.NotFound(ctx, err.Error())
		} else {
			utils.BadRequest(ctx, err.Error())
		}
		return
	}

	utils.Success(ctx, http.StatusOK, "Task retrieved", task)
}

func (c *TaskController) Update(ctx *gin.Context) {
	userID, _ := ctx.Get("userId")
	role, _ := ctx.Get("userRole")
	taskID := ctx.Param("id")

	var req models.UpdateTaskRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(ctx, err.Error())
		return
	}

	task, err := c.taskService.Update(ctx.Request.Context(), taskID, userID.(string), role.(string), &req)
	if err != nil {
		utils.BadRequest(ctx, err.Error())
		return
	}

	utils.Success(ctx, http.StatusOK, "Task updated successfully", task)
}

func (c *TaskController) Delete(ctx *gin.Context) {
	userID, _ := ctx.Get("userId")
	role, _ := ctx.Get("userRole")
	taskID := ctx.Param("id")

	if err := c.taskService.Delete(ctx.Request.Context(), taskID, userID.(string), role.(string)); err != nil {
		utils.BadRequest(ctx, err.Error())
		return
	}

	utils.Success(ctx, http.StatusOK, "Task deleted successfully", nil)
}

func (c *TaskController) AddComment(ctx *gin.Context) {
	userID, _ := ctx.Get("userId")
	taskID := ctx.Param("id")

	var req models.AddCommentRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(ctx, err.Error())
		return
	}

	task, err := c.taskService.AddComment(ctx.Request.Context(), taskID, userID.(string), &req)
	if err != nil {
		utils.BadRequest(ctx, err.Error())
		return
	}

	utils.Success(ctx, http.StatusOK, "Comment added", task)
}

func (c *TaskController) GetDashboardStats(ctx *gin.Context) {
	userID, _ := ctx.Get("userId")
	role, _ := ctx.Get("userRole")

	stats, err := c.taskService.GetDashboardStats(ctx.Request.Context(), userID.(string), role.(string))
	if err != nil {
		utils.InternalServerError(ctx, err.Error())
		return
	}

	utils.Success(ctx, http.StatusOK, "Dashboard stats retrieved", stats)
}
