package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// UserRole defines the role of a user in the system
type UserRole string

const (
	RoleAdmin  UserRole = "admin"
	RoleMember UserRole = "member"
)

// User represents a user in the system
type User struct {
	ID               primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	Name             string             `bson:"name" json:"name"`
	Email            string             `bson:"email" json:"email"`
	Password         string             `bson:"password" json:"-"` // Never expose password in JSON
	Role             UserRole           `bson:"role" json:"role"`
	Avatar           string             `bson:"avatar,omitempty" json:"avatar,omitempty"`
	IsActive         bool               `bson:"isActive" json:"isActive"`
	LastLogin        *time.Time         `bson:"lastLogin,omitempty" json:"lastLogin,omitempty"`
	ResetToken       string             `bson:"resetToken,omitempty" json:"-"`
	ResetTokenExpiry *time.Time         `bson:"resetTokenExpiry,omitempty" json:"-"`
	CreatedAt        time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt        time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// UserResponse is the safe user object returned to clients
type UserResponse struct {
	ID        primitive.ObjectID `json:"_id"`
	Name      string             `json:"name"`
	Email     string             `json:"email"`
	Role      UserRole           `json:"role"`
	Avatar    string             `json:"avatar,omitempty"`
	IsActive  bool               `json:"isActive"`
	LastLogin *time.Time         `json:"lastLogin,omitempty"`
	CreatedAt time.Time          `json:"createdAt"`
	UpdatedAt time.Time          `json:"updatedAt"`
}

// ToResponse converts User to UserResponse (strips sensitive fields)
func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:        u.ID,
		Name:      u.Name,
		Email:     u.Email,
		Role:      u.Role,
		Avatar:    u.Avatar,
		IsActive:  u.IsActive,
		LastLogin: u.LastLogin,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}

// RegisterRequest is the payload for user registration
type RegisterRequest struct {
	Name     string `json:"name" binding:"required,min=2,max=100"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Role     string `json:"role,omitempty"`
}

// LoginRequest is the payload for user login
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// UpdateUserRequest is the payload for updating user profile
type UpdateUserRequest struct {
	Name   string `json:"name,omitempty" binding:"omitempty,min=2,max=100"`
	Avatar string `json:"avatar,omitempty"`
}

// CreateMemberRequest is the payload for admin creating a member account
type CreateMemberRequest struct {
	Name     string `json:"name" binding:"required,min=2,max=100"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Role     string `json:"role,omitempty"` // defaults to "member"
}

// AuthResponse is returned after successful authentication
type AuthResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

// ForgotPasswordRequest payload
type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ResetPasswordRequest payload
type ResetPasswordRequest struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required,min=8"`
}
