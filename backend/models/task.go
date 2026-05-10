package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// TaskStatus defines the status of a task
type TaskStatus string

const (
	TaskStatusTodo       TaskStatus = "todo"
	TaskStatusInProgress TaskStatus = "in-progress"
	TaskStatusInReview   TaskStatus = "in-review"
	TaskStatusDone       TaskStatus = "done"
)

// TaskPriority defines the priority of a task
type TaskPriority string

const (
	TaskPriorityLow    TaskPriority = "low"
	TaskPriorityMedium TaskPriority = "medium"
	TaskPriorityHigh   TaskPriority = "high"
	TaskPriorityUrgent TaskPriority = "urgent"
)

// Comment represents a comment on a task
type Comment struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	UserID     primitive.ObjectID `bson:"userId" json:"userId"`
	UserName   string             `bson:"userName" json:"userName"`
	UserAvatar string             `bson:"userAvatar,omitempty" json:"userAvatar,omitempty"`
	Content    string             `bson:"content" json:"content"`
	CreatedAt  time.Time          `bson:"createdAt" json:"createdAt"`
}

// Attachment represents a file attached to a task
type Attachment struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	FileName   string             `bson:"fileName" json:"fileName"`
	FileURL    string             `bson:"fileURL" json:"fileURL"`
	FileSize   int64              `bson:"fileSize" json:"fileSize"`
	MimeType   string             `bson:"mimeType" json:"mimeType"`
	UploadedBy primitive.ObjectID `bson:"uploadedBy" json:"uploadedBy"`
	CreatedAt  time.Time          `bson:"createdAt" json:"createdAt"`
}

// Task represents a task in the system
type Task struct {
	ID          primitive.ObjectID  `bson:"_id,omitempty" json:"_id,omitempty"`
	Title       string              `bson:"title" json:"title"`
	Description string              `bson:"description,omitempty" json:"description,omitempty"`
	AssignedTo  *primitive.ObjectID `bson:"assignedTo,omitempty" json:"assignedTo,omitempty"`
	ProjectID   primitive.ObjectID  `bson:"projectId" json:"projectId"`
	Priority    TaskPriority        `bson:"priority" json:"priority"`
	Status      TaskStatus          `bson:"status" json:"status"`
	DueDate     *time.Time          `bson:"dueDate,omitempty" json:"dueDate,omitempty"`
	Tags        []string            `bson:"tags,omitempty" json:"tags,omitempty"`
	Comments    []Comment           `bson:"comments,omitempty" json:"comments,omitempty"`
	Attachments []Attachment        `bson:"attachments,omitempty" json:"attachments,omitempty"`
	CreatedBy   primitive.ObjectID  `bson:"createdBy" json:"createdBy"`
	Order       int                 `bson:"order" json:"order"`
	CreatedAt   time.Time           `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time           `bson:"updatedAt" json:"updatedAt"`
}

// TaskWithDetails includes populated user data
type TaskWithDetails struct {
	ID          primitive.ObjectID `json:"_id"`
	Title       string             `json:"title"`
	Description string             `json:"description,omitempty"`
	AssignedTo  *UserResponse      `json:"assignedTo,omitempty"`
	ProjectID   primitive.ObjectID `json:"projectId"`
	ProjectName string             `json:"projectName,omitempty"`
	Priority    TaskPriority       `json:"priority"`
	Status      TaskStatus         `json:"status"`
	DueDate     *time.Time         `json:"dueDate,omitempty"`
	Tags        []string           `json:"tags,omitempty"`
	Comments    []Comment          `json:"comments,omitempty"`
	Attachments []Attachment       `json:"attachments,omitempty"`
	CreatedBy   UserResponse       `json:"createdBy"`
	Order       int                `json:"order"`
	IsOverdue   bool               `json:"isOverdue"`
	CreatedAt   time.Time          `json:"createdAt"`
	UpdatedAt   time.Time          `json:"updatedAt"`
}

// CreateTaskRequest is the payload for creating a task
type CreateTaskRequest struct {
	Title       string   `json:"title" binding:"required,min=2,max=300"`
	Description string   `json:"description,omitempty"`
	AssignedTo  string   `json:"assignedTo,omitempty"`
	ProjectID   string   `json:"projectId" binding:"required"`
	Priority    string   `json:"priority,omitempty"`
	Status      string   `json:"status,omitempty"`
	DueDate     string   `json:"dueDate,omitempty"`
	Tags        []string `json:"tags,omitempty"`
}

// UpdateTaskRequest is the payload for updating a task
type UpdateTaskRequest struct {
	Title       string   `json:"title,omitempty" binding:"omitempty,min=2,max=300"`
	Description string   `json:"description,omitempty"`
	AssignedTo  string   `json:"assignedTo,omitempty"`
	Priority    string   `json:"priority,omitempty"`
	Status      string   `json:"status,omitempty"`
	DueDate     string   `json:"dueDate,omitempty"`
	Tags        []string `json:"tags,omitempty"`
	Order       *int     `json:"order,omitempty"`
}

// AddCommentRequest is the payload for adding a comment
type AddCommentRequest struct {
	Content string `json:"content" binding:"required,min=1,max=2000"`
}
