package services

import (
	"context"
	"errors"
	"time"

	"github.com/teamtaskmanager/backend/models"
	"github.com/teamtaskmanager/backend/repositories"
	"github.com/teamtaskmanager/backend/utils"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo     *repositories.UserRepository
	activityRepo *repositories.ActivityRepository
}

func NewAuthService() *AuthService {
	return &AuthService{
		userRepo:     repositories.NewUserRepository(),
		activityRepo: repositories.NewActivityRepository(),
	}
}

// Register creates a new user account
func (s *AuthService) Register(ctx context.Context, req *models.RegisterRequest) (*models.AuthResponse, error) {
	// Check if email already exists
	existing, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err != nil && err != mongo.ErrNoDocuments {
		return nil, errors.New("database error")
	}
	if existing != nil {
		return nil, errors.New("email already registered")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("failed to process password")
	}

	// Determine role (first user becomes admin, rest are members)
	role := models.RoleMember
	if req.Role == "admin" {
		role = models.RoleAdmin
	}

	user := &models.User{
		Name:     req.Name,
		Email:    req.Email,
		Password: string(hashedPassword),
		Role:     role,
		Avatar:   generateAvatar(req.Name),
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, errors.New("failed to create user")
	}

	// Generate JWT token
	token, err := utils.GenerateToken(user.ID, user.Email, string(user.Role))
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	// Log activity
	s.activityRepo.Create(ctx, &models.ActivityLog{
		UserID:     user.ID,
		UserName:   user.Name,
		UserAvatar: user.Avatar,
		Action:     models.ActionCreated,
		Entity:     models.EntityUser,
		EntityID:   user.ID,
		EntityName: user.Name,
		Details:    "New user registered",
	})

	return &models.AuthResponse{
		Token: token,
		User:  user.ToResponse(),
	}, nil
}

// Login authenticates a user and returns a JWT token
func (s *AuthService) Login(ctx context.Context, req *models.LoginRequest) (*models.AuthResponse, error) {
	user, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("invalid email or password")
		}
		return nil, errors.New("database error")
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	if !user.IsActive {
		return nil, errors.New("account is deactivated")
	}

	// Generate JWT token
	token, err := utils.GenerateToken(user.ID, user.Email, string(user.Role))
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	// Update last login
	s.userRepo.UpdateLastLogin(ctx, user.ID)

	return &models.AuthResponse{
		Token: token,
		User:  user.ToResponse(),
	}, nil
}

// generateAvatar creates a default avatar URL using UI Avatars service
func generateAvatar(name string) string {
	return "https://ui-avatars.com/api/?name=" + name + "&background=6366f1&color=fff&size=128"
}

// GetProfile returns the current user's profile
func (s *AuthService) GetProfile(ctx context.Context, userID string) (*models.UserResponse, error) {
	id, err := parseObjectID(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	user, err := s.userRepo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.New("user not found")
	}

	resp := user.ToResponse()
	return &resp, nil
}

// UpdateProfile updates user profile information
func (s *AuthService) UpdateProfile(ctx context.Context, userID string, req *models.UpdateUserRequest) (*models.UserResponse, error) {
	id, err := parseObjectID(userID)
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

	if len(update) == 0 {
		return nil, errors.New("no fields to update")
	}

	if err := s.userRepo.Update(ctx, id, update); err != nil {
		return nil, errors.New("failed to update profile")
	}

	user, err := s.userRepo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.New("user not found")
	}

	resp := user.ToResponse()
	return &resp, nil
}

// ChangePassword updates user password
func (s *AuthService) ChangePassword(ctx context.Context, userID, currentPassword, newPassword string) error {
	id, err := parseObjectID(userID)
	if err != nil {
		return errors.New("invalid user ID")
	}

	user, err := s.userRepo.FindByID(ctx, id)
	if err != nil {
		return errors.New("user not found")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(currentPassword)); err != nil {
		return errors.New("current password is incorrect")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("failed to process password")
	}

	return s.userRepo.Update(ctx, id, map[string]interface{}{
		"password":  string(hashedPassword),
		"updatedAt": time.Now(),
	})
}
