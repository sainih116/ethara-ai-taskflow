package services

import (
	"context"
	"errors"

	"github.com/teamtaskmanager/backend/models"
	"github.com/teamtaskmanager/backend/repositories"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	userRepo *repositories.UserRepository
}

func NewUserService() *UserService {
	return &UserService{
		userRepo: repositories.NewUserRepository(),
	}
}

// GetAll returns all users (admin only)
func (s *UserService) GetAll(ctx context.Context, skip int64, limit int) ([]models.UserResponse, int64, error) {
	users, total, err := s.userRepo.FindAll(ctx, skip, limit)
	if err != nil {
		return nil, 0, errors.New("failed to fetch users")
	}

	var result []models.UserResponse
	for _, u := range users {
		result = append(result, u.ToResponse())
	}
	return result, total, nil
}

// GetByID returns a single user by ID
func (s *UserService) GetByID(ctx context.Context, userID string) (*models.UserResponse, error) {
	oid, err := parseObjectID(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	user, err := s.userRepo.FindByID(ctx, oid)
	if err != nil {
		return nil, errors.New("user not found")
	}

	resp := user.ToResponse()
	return &resp, nil
}

// Update updates a user's profile fields
func (s *UserService) Update(ctx context.Context, userID string, req *models.UpdateUserRequest) (*models.UserResponse, error) {
	oid, err := parseObjectID(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	update := map[string]interface{}{}
	if req.Name != "" {
		update["name"] = req.Name
	}
	if req.Avatar != "" {
		update["avatar"] = req.Avatar
	}

	if err := s.userRepo.Update(ctx, oid, update); err != nil {
		return nil, errors.New("failed to update user")
	}

	user, err := s.userRepo.FindByID(ctx, oid)
	if err != nil {
		return nil, errors.New("user not found")
	}

	resp := user.ToResponse()
	return &resp, nil
}

// CreateMember allows an admin to create a new member account directly
func (s *UserService) CreateMember(ctx context.Context, req *models.CreateMemberRequest) (*models.UserResponse, error) {
	// Check email uniqueness
	existing, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err != nil && err != mongo.ErrNoDocuments {
		return nil, errors.New("database error")
	}
	if existing != nil {
		return nil, errors.New("email already registered")
	}

	// Hash password
	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("failed to process password")
	}

	// Determine role — admin can set admin or member; default is member
	role := models.RoleMember
	if req.Role == "admin" {
		role = models.RoleAdmin
	}

	user := &models.User{
		Name:     req.Name,
		Email:    req.Email,
		Password: string(hashed),
		Role:     role,
		Avatar:   "https://ui-avatars.com/api/?name=" + req.Name + "&background=4f46e5&color=fff&size=128",
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, errors.New("failed to create member")
	}

	resp := user.ToResponse()
	return &resp, nil
}

// Delete removes a user account (admin only)
func (s *UserService) Delete(ctx context.Context, userID string) error {
	oid, err := parseObjectID(userID)
	if err != nil {
		return errors.New("invalid user ID")
	}
	return s.userRepo.Delete(ctx, oid)
}
