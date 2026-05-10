package services

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
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
	existing, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err != nil && err != mongo.ErrNoDocuments {
		return nil, errors.New("database error")
	}
	if existing != nil {
		return nil, errors.New("email already registered")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("failed to process password")
	}

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

	token, err := utils.GenerateToken(user.ID, user.Email, string(user.Role))
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

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

	return &models.AuthResponse{Token: token, User: user.ToResponse()}, nil
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

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	if !user.IsActive {
		return nil, errors.New("account is deactivated")
	}

	token, err := utils.GenerateToken(user.ID, user.Email, string(user.Role))
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	s.userRepo.UpdateLastLogin(ctx, user.ID)

	return &models.AuthResponse{Token: token, User: user.ToResponse()}, nil
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

// ChangePassword updates user password (requires current password)
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

// ForgotPassword generates a reset token for the given email
// Returns the token (in production this would be emailed; here we return it directly)
func (s *AuthService) ForgotPassword(ctx context.Context, email string) (string, error) {
	user, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		// Don't reveal whether email exists — return empty token silently
		return "", nil
	}

	token, err := generateResetToken()
	if err != nil {
		return "", errors.New("failed to generate reset token")
	}

	expiry := time.Now().Add(1 * time.Hour)
	if err := s.userRepo.Update(ctx, user.ID, map[string]interface{}{
		"resetToken":       token,
		"resetTokenExpiry": expiry,
		"updatedAt":        time.Now(),
	}); err != nil {
		return "", errors.New("failed to save reset token")
	}

	return token, nil
}

// ResetPassword validates the token and sets a new password
func (s *AuthService) ResetPassword(ctx context.Context, token, newPassword string) error {
	user, err := s.userRepo.FindByResetToken(ctx, token)
	if err != nil {
		return errors.New("invalid or expired reset token")
	}

	if user.ResetTokenExpiry == nil || time.Now().After(*user.ResetTokenExpiry) {
		return errors.New("reset token has expired — please request a new one")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("failed to process password")
	}

	return s.userRepo.Update(ctx, user.ID, map[string]interface{}{
		"password":         string(hashedPassword),
		"resetToken":       "",
		"resetTokenExpiry": nil,
		"updatedAt":        time.Now(),
	})
}

// generateAvatar creates a default avatar URL
func generateAvatar(name string) string {
	return "https://ui-avatars.com/api/?name=" + name + "&background=6366f1&color=fff&size=128"
}

// generateResetToken creates a cryptographically secure random hex token
func generateResetToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return fmt.Sprintf("%x", b), nil
}
