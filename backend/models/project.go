package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ProjectStatus defines the status of a project
type ProjectStatus string

const (
	ProjectStatusActive    ProjectStatus = "active"
	ProjectStatusOnHold    ProjectStatus = "on-hold"
	ProjectStatusCompleted ProjectStatus = "completed"
	ProjectStatusArchived  ProjectStatus = "archived"
)

// Project represents a project in the system
type Project struct {
	ID          primitive.ObjectID   `bson:"_id,omitempty" json:"_id,omitempty"`
	Title       string               `bson:"title" json:"title"`
	Description string               `bson:"description,omitempty" json:"description,omitempty"`
	CreatedBy   primitive.ObjectID   `bson:"createdBy" json:"createdBy"`
	Members     []primitive.ObjectID `bson:"members" json:"members"`
	Status      ProjectStatus        `bson:"status" json:"status"`
	Deadline    *time.Time           `bson:"deadline,omitempty" json:"deadline,omitempty"`
	Color       string               `bson:"color,omitempty" json:"color,omitempty"`
	CreatedAt   time.Time            `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time            `bson:"updatedAt" json:"updatedAt"`
}

// ProjectWithDetails includes populated user and task count data
type ProjectWithDetails struct {
	ID          primitive.ObjectID `json:"_id"`
	Title       string             `json:"title"`
	Description string             `json:"description,omitempty"`
	CreatedBy   UserResponse       `json:"createdBy"`
	Members     []UserResponse     `json:"members"`
	Status      ProjectStatus      `json:"status"`
	Deadline    *time.Time         `json:"deadline,omitempty"`
	Color       string             `json:"color,omitempty"`
	TaskCount   int                `json:"taskCount"`
	CreatedAt   time.Time          `json:"createdAt"`
	UpdatedAt   time.Time          `json:"updatedAt"`
}

// CreateProjectRequest is the payload for creating a project
type CreateProjectRequest struct {
	Title       string   `json:"title" binding:"required,min=2,max=200"`
	Description string   `json:"description,omitempty"`
	Members     []string `json:"members,omitempty"`
	Status      string   `json:"status,omitempty"`
	Deadline    string   `json:"deadline,omitempty"`
	Color       string   `json:"color,omitempty"`
}

// UpdateProjectRequest is the payload for updating a project
type UpdateProjectRequest struct {
	Title       string   `json:"title,omitempty" binding:"omitempty,min=2,max=200"`
	Description string   `json:"description,omitempty"`
	Members     []string `json:"members,omitempty"`
	Status      string   `json:"status,omitempty"`
	Deadline    string   `json:"deadline,omitempty"`
	Color       string   `json:"color,omitempty"`
}
