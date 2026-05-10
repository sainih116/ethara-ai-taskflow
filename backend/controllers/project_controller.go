package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/teamtaskmanager/backend/models"
	"github.com/teamtaskmanager/backend/services"
	"github.com/teamtaskmanager/backend/utils"
)

type ProjectController struct {
	projectService *services.ProjectService
}

func NewProjectController() *ProjectController {
	return &ProjectController{
		projectService: services.NewProjectService(),
	}
}

func (c *ProjectController) Create(ctx *gin.Context) {
	userID, _ := ctx.Get("userId")

	var req models.CreateProjectRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(ctx, err.Error())
		return
	}

	project, err := c.projectService.Create(ctx.Request.Context(), &req, userID.(string))
	if err != nil {
		utils.BadRequest(ctx, err.Error())
		return
	}

	utils.Success(ctx, http.StatusCreated, "Project created successfully", project)
}

func (c *ProjectController) GetAll(ctx *gin.Context) {
	userID, _ := ctx.Get("userId")
	role, _ := ctx.Get("userRole")

	pagination := utils.GetPagination(ctx)
	status := ctx.Query("status")

	projects, total, err := c.projectService.GetAll(
		ctx.Request.Context(),
		userID.(string),
		role.(string),
		pagination.Skip,
		pagination.Limit,
		status,
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

	utils.SuccessWithMeta(ctx, http.StatusOK, "Projects retrieved", projects, meta)
}

func (c *ProjectController) GetByID(ctx *gin.Context) {
	userID, _ := ctx.Get("userId")
	role, _ := ctx.Get("userRole")
	projectID := ctx.Param("id")

	project, err := c.projectService.GetByID(ctx.Request.Context(), projectID, userID.(string), role.(string))
	if err != nil {
		if err.Error() == "project not found" {
			utils.NotFound(ctx, err.Error())
		} else if err.Error() == "access denied" {
			utils.Forbidden(ctx, err.Error())
		} else {
			utils.BadRequest(ctx, err.Error())
		}
		return
	}

	utils.Success(ctx, http.StatusOK, "Project retrieved", project)
}

func (c *ProjectController) Update(ctx *gin.Context) {
	userID, _ := ctx.Get("userId")
	role, _ := ctx.Get("userRole")
	projectID := ctx.Param("id")

	var req models.UpdateProjectRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(ctx, err.Error())
		return
	}

	project, err := c.projectService.Update(ctx.Request.Context(), projectID, userID.(string), role.(string), &req)
	if err != nil {
		utils.BadRequest(ctx, err.Error())
		return
	}

	utils.Success(ctx, http.StatusOK, "Project updated successfully", project)
}

func (c *ProjectController) Delete(ctx *gin.Context) {
	userID, _ := ctx.Get("userId")
	role, _ := ctx.Get("userRole")
	projectID := ctx.Param("id")

	if err := c.projectService.Delete(ctx.Request.Context(), projectID, userID.(string), role.(string)); err != nil {
		utils.BadRequest(ctx, err.Error())
		return
	}

	utils.Success(ctx, http.StatusOK, "Project deleted successfully", nil)
}
