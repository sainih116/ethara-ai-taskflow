package services

import (
	"context"
	"errors"
	"time"

	"github.com/teamtaskmanager/backend/models"
	"github.com/teamtaskmanager/backend/repositories"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type TaskService struct {
	taskRepo     *repositories.TaskRepository
	projectRepo  *repositories.ProjectRepository
	userRepo     *repositories.UserRepository
	activityRepo *repositories.ActivityRepository
}

func NewTaskService() *TaskService {
	return &TaskService{
		taskRepo:     repositories.NewTaskRepository(),
		projectRepo:  repositories.NewProjectRepository(),
		userRepo:     repositories.NewUserRepository(),
		activityRepo: repositories.NewActivityRepository(),
	}
}

func (s *TaskService) Create(ctx context.Context, req *models.CreateTaskRequest, creatorID string) (*models.TaskWithDetails, error) {
	creatorOID, err := parseObjectID(creatorID)
	if err != nil {
		return nil, errors.New("invalid creator ID")
	}

	projectOID, err := parseObjectID(req.ProjectID)
	if err != nil {
		return nil, errors.New("invalid project ID")
	}

	// Verify project exists
	project, err := s.projectRepo.FindByID(ctx, projectOID)
	if err != nil {
		return nil, errors.New("project not found")
	}

	task := &models.Task{
		Title:       req.Title,
		Description: req.Description,
		ProjectID:   projectOID,
		CreatedBy:   creatorOID,
		Tags:        req.Tags,
	}

	// Set priority
	switch req.Priority {
	case "low":
		task.Priority = models.TaskPriorityLow
	case "high":
		task.Priority = models.TaskPriorityHigh
	case "urgent":
		task.Priority = models.TaskPriorityUrgent
	default:
		task.Priority = models.TaskPriorityMedium
	}

	// Set status
	switch req.Status {
	case "in-progress":
		task.Status = models.TaskStatusInProgress
	case "in-review":
		task.Status = models.TaskStatusInReview
	case "done":
		task.Status = models.TaskStatusDone
	default:
		task.Status = models.TaskStatusTodo
	}

	// Set assignee
	if req.AssignedTo != "" {
		assigneeOID, err := parseObjectID(req.AssignedTo)
		if err == nil {
			task.AssignedTo = &assigneeOID
		}
	}

	// Parse due date
	if req.DueDate != "" {
		dueDate, err := time.Parse(time.RFC3339, req.DueDate)
		if err != nil {
			dueDate, err = time.Parse("2006-01-02", req.DueDate)
			if err != nil {
				return nil, errors.New("invalid due date format")
			}
		}
		task.DueDate = &dueDate
	}

	if err := s.taskRepo.Create(ctx, task); err != nil {
		return nil, errors.New("failed to create task")
	}

	// Log activity
	creator, _ := s.userRepo.FindByID(ctx, creatorOID)
	if creator != nil {
		s.activityRepo.Create(ctx, &models.ActivityLog{
			UserID:     creatorOID,
			UserName:   creator.Name,
			UserAvatar: creator.Avatar,
			Action:     models.ActionCreated,
			Entity:     models.EntityTask,
			EntityID:   task.ID,
			EntityName: task.Title,
			ProjectID:  &projectOID,
			Details:    "Created task: " + task.Title + " in project: " + project.Title,
		})
	}

	return s.populateTask(ctx, task)
}

func (s *TaskService) GetAll(ctx context.Context, userID, role string, filter repositories.TaskFilter, skip int64, limit int) ([]models.TaskWithDetails, int64, error) {
	userOID, err := parseObjectID(userID)
	if err != nil {
		return nil, 0, errors.New("invalid user ID")
	}

	tasks, total, err := s.taskRepo.FindAll(ctx, userOID, role, filter, skip, limit)
	if err != nil {
		return nil, 0, errors.New("failed to fetch tasks")
	}

	var result []models.TaskWithDetails
	for _, t := range tasks {
		details, err := s.populateTask(ctx, &t)
		if err != nil {
			continue
		}
		result = append(result, *details)
	}

	return result, total, nil
}

func (s *TaskService) GetByID(ctx context.Context, taskID, userID, role string) (*models.TaskWithDetails, error) {
	taskOID, err := parseObjectID(taskID)
	if err != nil {
		return nil, errors.New("invalid task ID")
	}

	task, err := s.taskRepo.FindByID(ctx, taskOID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("task not found")
		}
		return nil, errors.New("failed to fetch task")
	}

	// Check access for members
	if role != "admin" {
		userOID, _ := parseObjectID(userID)
		if task.AssignedTo == nil || *task.AssignedTo != userOID {
			// Check if user is a project member
			project, err := s.projectRepo.FindByID(ctx, task.ProjectID)
			if err != nil || !isMember(project.Members, userOID) {
				return nil, errors.New("access denied")
			}
		}
	}

	return s.populateTask(ctx, task)
}

func (s *TaskService) Update(ctx context.Context, taskID, userID, role string, req *models.UpdateTaskRequest) (*models.TaskWithDetails, error) {
	taskOID, err := parseObjectID(taskID)
	if err != nil {
		return nil, errors.New("invalid task ID")
	}

	task, err := s.taskRepo.FindByID(ctx, taskOID)
	if err != nil {
		return nil, errors.New("task not found")
	}

	userOID, _ := parseObjectID(userID)

	// Members can only update status of their assigned tasks
	if role != "admin" {
		if task.AssignedTo == nil || *task.AssignedTo != userOID {
			return nil, errors.New("you can only update tasks assigned to you")
		}
	}

	update := bson.M{}
	oldStatus := task.Status

	if req.Title != "" && role == "admin" {
		update["title"] = req.Title
	}
	if req.Description != "" {
		update["description"] = req.Description
	}
	if req.Status != "" {
		update["status"] = req.Status
	}
	if req.Priority != "" && role == "admin" {
		update["priority"] = req.Priority
	}
	if req.AssignedTo != "" && role == "admin" {
		if assigneeOID, err := parseObjectID(req.AssignedTo); err == nil {
			update["assignedTo"] = assigneeOID
		}
	}
	if req.DueDate != "" && role == "admin" {
		dueDate, err := time.Parse(time.RFC3339, req.DueDate)
		if err != nil {
			dueDate, _ = time.Parse("2006-01-02", req.DueDate)
		}
		update["dueDate"] = dueDate
	}
	if req.Tags != nil {
		update["tags"] = req.Tags
	}
	if req.Order != nil {
		update["order"] = *req.Order
	}

	if err := s.taskRepo.Update(ctx, taskOID, update); err != nil {
		return nil, errors.New("failed to update task")
	}

	// Log status change
	if req.Status != "" && string(oldStatus) != req.Status {
		user, _ := s.userRepo.FindByID(ctx, userOID)
		if user != nil {
			s.activityRepo.Create(ctx, &models.ActivityLog{
				UserID:     userOID,
				UserName:   user.Name,
				UserAvatar: user.Avatar,
				Action:     models.ActionStatus,
				Entity:     models.EntityTask,
				EntityID:   taskOID,
				EntityName: task.Title,
				ProjectID:  &task.ProjectID,
				Details:    "Changed status from " + string(oldStatus) + " to " + req.Status,
			})
		}
	}

	updatedTask, err := s.taskRepo.FindByID(ctx, taskOID)
	if err != nil {
		return nil, errors.New("failed to fetch updated task")
	}

	return s.populateTask(ctx, updatedTask)
}

func (s *TaskService) Delete(ctx context.Context, taskID, userID, role string) error {
	taskOID, err := parseObjectID(taskID)
	if err != nil {
		return errors.New("invalid task ID")
	}

	task, err := s.taskRepo.FindByID(ctx, taskOID)
	if err != nil {
		return errors.New("task not found")
	}

	userOID, _ := parseObjectID(userID)
	if role != "admin" && task.CreatedBy != userOID {
		return errors.New("only task creator or admin can delete")
	}

	return s.taskRepo.Delete(ctx, taskOID)
}

func (s *TaskService) AddComment(ctx context.Context, taskID, userID string, req *models.AddCommentRequest) (*models.TaskWithDetails, error) {
	taskOID, err := parseObjectID(taskID)
	if err != nil {
		return nil, errors.New("invalid task ID")
	}

	userOID, err := parseObjectID(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	user, err := s.userRepo.FindByID(ctx, userOID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	comment := models.Comment{
		UserID:     userOID,
		UserName:   user.Name,
		UserAvatar: user.Avatar,
		Content:    req.Content,
	}

	if err := s.taskRepo.AddComment(ctx, taskOID, comment); err != nil {
		return nil, errors.New("failed to add comment")
	}

	task, err := s.taskRepo.FindByID(ctx, taskOID)
	if err != nil {
		return nil, errors.New("task not found")
	}

	// Log activity
	s.activityRepo.Create(ctx, &models.ActivityLog{
		UserID:     userOID,
		UserName:   user.Name,
		UserAvatar: user.Avatar,
		Action:     models.ActionComment,
		Entity:     models.EntityTask,
		EntityID:   taskOID,
		EntityName: task.Title,
		ProjectID:  &task.ProjectID,
		Details:    "Commented on task: " + task.Title,
	})

	return s.populateTask(ctx, task)
}

// populateTask fills in user details for a task
func (s *TaskService) populateTask(ctx context.Context, task *models.Task) (*models.TaskWithDetails, error) {
	details := &models.TaskWithDetails{
		ID:          task.ID,
		Title:       task.Title,
		Description: task.Description,
		ProjectID:   task.ProjectID,
		Priority:    task.Priority,
		Status:      task.Status,
		DueDate:     task.DueDate,
		Tags:        task.Tags,
		Comments:    task.Comments,
		Attachments: task.Attachments,
		Order:       task.Order,
		CreatedAt:   task.CreatedAt,
		UpdatedAt:   task.UpdatedAt,
	}

	// Check if overdue
	if task.DueDate != nil && task.Status != models.TaskStatusDone {
		details.IsOverdue = time.Now().After(*task.DueDate)
	}

	// Populate assignee
	if task.AssignedTo != nil {
		assignee, err := s.userRepo.FindByID(ctx, *task.AssignedTo)
		if err == nil {
			resp := assignee.ToResponse()
			details.AssignedTo = &resp
		}
	}

	// Populate creator
	creator, err := s.userRepo.FindByID(ctx, task.CreatedBy)
	if err == nil {
		details.CreatedBy = creator.ToResponse()
	}

	// Get project name
	project, err := s.projectRepo.FindByID(ctx, task.ProjectID)
	if err == nil {
		details.ProjectName = project.Title
	}

	return details, nil
}

// GetDashboardStats returns aggregated statistics
func (s *TaskService) GetDashboardStats(ctx context.Context, userID, role string) (map[string]interface{}, error) {
	userOID, err := parseObjectID(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	taskStats, err := s.taskRepo.GetStats(ctx, userOID, role)
	if err != nil {
		return nil, errors.New("failed to get task stats")
	}

	projectCount, _ := s.projectRepo.CountByUser(ctx, userOID)

	priorityData, _ := s.taskRepo.GetTasksByPriority(ctx, userOID, role)
	trendData, _ := s.taskRepo.GetCompletionTrend(ctx, userOID, role, 30)

	recentActivity, _ := repositories.NewActivityRepository().FindRecent(ctx, userOID, role, 10)

	var completionRate float64
	if taskStats.TotalTasks > 0 {
		completionRate = float64(taskStats.CompletedTasks) / float64(taskStats.TotalTasks) * 100
	}

	return map[string]interface{}{
		"totalProjects":   projectCount,
		"totalTasks":      taskStats.TotalTasks,
		"completedTasks":  taskStats.CompletedTasks,
		"pendingTasks":    taskStats.PendingTasks,
		"inProgressTasks": taskStats.InProgressTasks,
		"overdueTasks":    taskStats.OverdueTasks,
		"completionRate":  completionRate,
		"tasksByPriority": priorityData,
		"completionTrend": trendData,
		"recentActivity":  recentActivity,
	}, nil
}
