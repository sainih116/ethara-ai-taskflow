package services

import (
	"context"
	"errors"
	"time"

	"github.com/teamtaskmanager/backend/models"
	"github.com/teamtaskmanager/backend/repositories"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type ProjectService struct {
	projectRepo  *repositories.ProjectRepository
	userRepo     *repositories.UserRepository
	taskRepo     *repositories.TaskRepository
	activityRepo *repositories.ActivityRepository
}

func NewProjectService() *ProjectService {
	return &ProjectService{
		projectRepo:  repositories.NewProjectRepository(),
		userRepo:     repositories.NewUserRepository(),
		taskRepo:     repositories.NewTaskRepository(),
		activityRepo: repositories.NewActivityRepository(),
	}
}

func (s *ProjectService) Create(ctx context.Context, req *models.CreateProjectRequest, creatorID string) (*models.Project, error) {
	creatorOID, err := parseObjectID(creatorID)
	if err != nil {
		return nil, errors.New("invalid creator ID")
	}

	project := &models.Project{
		Title:       req.Title,
		Description: req.Description,
		CreatedBy:   creatorOID,
		Members:     []primitive.ObjectID{creatorOID}, // Creator is always a member
		Color:       req.Color,
	}

	// Set status
	switch req.Status {
	case "on-hold":
		project.Status = models.ProjectStatusOnHold
	case "completed":
		project.Status = models.ProjectStatusCompleted
	case "archived":
		project.Status = models.ProjectStatusArchived
	default:
		project.Status = models.ProjectStatusActive
	}

	// Parse deadline
	if req.Deadline != "" {
		deadline, err := time.Parse(time.RFC3339, req.Deadline)
		if err != nil {
			deadline, err = time.Parse("2006-01-02", req.Deadline)
			if err != nil {
				return nil, errors.New("invalid deadline format. Use RFC3339 or YYYY-MM-DD")
			}
		}
		project.Deadline = &deadline
	}

	// Add additional members
	for _, memberIDStr := range req.Members {
		memberID, err := parseObjectID(memberIDStr)
		if err != nil {
			continue
		}
		if memberID != creatorOID {
			project.Members = append(project.Members, memberID)
		}
	}

	if err := s.projectRepo.Create(ctx, project); err != nil {
		return nil, errors.New("failed to create project")
	}

	// Log activity
	creator, _ := s.userRepo.FindByID(ctx, creatorOID)
	if creator != nil {
		s.activityRepo.Create(ctx, &models.ActivityLog{
			UserID:     creatorOID,
			UserName:   creator.Name,
			UserAvatar: creator.Avatar,
			Action:     models.ActionCreated,
			Entity:     models.EntityProject,
			EntityID:   project.ID,
			EntityName: project.Title,
			ProjectID:  &project.ID,
			Details:    "Created project: " + project.Title,
		})
	}

	return project, nil
}

func (s *ProjectService) GetAll(ctx context.Context, userID, role string, skip int64, limit int, status string) ([]models.ProjectWithDetails, int64, error) {
	userOID, err := parseObjectID(userID)
	if err != nil {
		return nil, 0, errors.New("invalid user ID")
	}

	projects, total, err := s.projectRepo.FindAll(ctx, userOID, role, skip, limit, status)
	if err != nil {
		return nil, 0, errors.New("failed to fetch projects")
	}

	// Populate project details
	var result []models.ProjectWithDetails
	for _, p := range projects {
		details, err := s.populateProject(ctx, &p)
		if err != nil {
			continue
		}
		result = append(result, *details)
	}

	return result, total, nil
}

func (s *ProjectService) GetByID(ctx context.Context, projectID, userID, role string) (*models.ProjectWithDetails, error) {
	projectOID, err := parseObjectID(projectID)
	if err != nil {
		return nil, errors.New("invalid project ID")
	}

	project, err := s.projectRepo.FindByID(ctx, projectOID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("project not found")
		}
		return nil, errors.New("failed to fetch project")
	}

	// Check access
	if role != "admin" {
		userOID, _ := parseObjectID(userID)
		if !isMember(project.Members, userOID) && project.CreatedBy != userOID {
			return nil, errors.New("access denied")
		}
	}

	return s.populateProject(ctx, project)
}

func (s *ProjectService) Update(ctx context.Context, projectID, userID, role string, req *models.UpdateProjectRequest) (*models.Project, error) {
	projectOID, err := parseObjectID(projectID)
	if err != nil {
		return nil, errors.New("invalid project ID")
	}

	project, err := s.projectRepo.FindByID(ctx, projectOID)
	if err != nil {
		return nil, errors.New("project not found")
	}

	// Only admin or project creator can update
	userOID, _ := parseObjectID(userID)
	if role != "admin" && project.CreatedBy != userOID {
		return nil, errors.New("only project creator or admin can update")
	}

	update := bson.M{}
	if req.Title != "" {
		update["title"] = req.Title
	}
	if req.Description != "" {
		update["description"] = req.Description
	}
	if req.Status != "" {
		update["status"] = req.Status
	}
	if req.Color != "" {
		update["color"] = req.Color
	}
	if req.Deadline != "" {
		deadline, err := time.Parse(time.RFC3339, req.Deadline)
		if err != nil {
			deadline, err = time.Parse("2006-01-02", req.Deadline)
			if err != nil {
				return nil, errors.New("invalid deadline format")
			}
		}
		update["deadline"] = deadline
	}
	if req.Members != nil {
		var memberIDs []primitive.ObjectID
		for _, m := range req.Members {
			if oid, err := parseObjectID(m); err == nil {
				memberIDs = append(memberIDs, oid)
			}
		}
		update["members"] = memberIDs
	}

	if err := s.projectRepo.Update(ctx, projectOID, update); err != nil {
		return nil, errors.New("failed to update project")
	}

	// Log activity
	creator, _ := s.userRepo.FindByID(ctx, userOID)
	if creator != nil {
		s.activityRepo.Create(ctx, &models.ActivityLog{
			UserID:     userOID,
			UserName:   creator.Name,
			UserAvatar: creator.Avatar,
			Action:     models.ActionUpdated,
			Entity:     models.EntityProject,
			EntityID:   projectOID,
			EntityName: project.Title,
			ProjectID:  &projectOID,
			Details:    "Updated project: " + project.Title,
		})
	}

	return s.projectRepo.FindByID(ctx, projectOID)
}

func (s *ProjectService) Delete(ctx context.Context, projectID, userID, role string) error {
	projectOID, err := parseObjectID(projectID)
	if err != nil {
		return errors.New("invalid project ID")
	}

	project, err := s.projectRepo.FindByID(ctx, projectOID)
	if err != nil {
		return errors.New("project not found")
	}

	userOID, _ := parseObjectID(userID)
	if role != "admin" && project.CreatedBy != userOID {
		return errors.New("only project creator or admin can delete")
	}

	// Delete all tasks in the project
	s.taskRepo.DeleteByProject(ctx, projectOID)

	return s.projectRepo.Delete(ctx, projectOID)
}

// populateProject fills in user details for a project
func (s *ProjectService) populateProject(ctx context.Context, project *models.Project) (*models.ProjectWithDetails, error) {
	creator, _ := s.userRepo.FindByID(ctx, project.CreatedBy)

	var members []models.UserResponse
	for _, memberID := range project.Members {
		user, err := s.userRepo.FindByID(ctx, memberID)
		if err == nil {
			members = append(members, user.ToResponse())
		}
	}

	tasks, _ := s.taskRepo.FindByProject(ctx, project.ID)

	details := &models.ProjectWithDetails{
		ID:          project.ID,
		Title:       project.Title,
		Description: project.Description,
		Status:      project.Status,
		Deadline:    project.Deadline,
		Color:       project.Color,
		Members:     members,
		TaskCount:   len(tasks),
		CreatedAt:   project.CreatedAt,
		UpdatedAt:   project.UpdatedAt,
	}

	if creator != nil {
		details.CreatedBy = creator.ToResponse()
	}

	return details, nil
}

func isMember(members []primitive.ObjectID, userID primitive.ObjectID) bool {
	for _, m := range members {
		if m == userID {
			return true
		}
	}
	return false
}
