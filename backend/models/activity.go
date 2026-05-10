package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ActivityAction defines the type of activity
type ActivityAction string

const (
	ActionCreated  ActivityAction = "created"
	ActionUpdated  ActivityAction = "updated"
	ActionDeleted  ActivityAction = "deleted"
	ActionAssigned ActivityAction = "assigned"
	ActionComment  ActivityAction = "commented"
	ActionStatus   ActivityAction = "status_changed"
	ActionJoined   ActivityAction = "joined"
	ActionLeft     ActivityAction = "left"
)

// ActivityEntity defines what entity the activity is about
type ActivityEntity string

const (
	EntityProject ActivityEntity = "project"
	EntityTask    ActivityEntity = "task"
	EntityUser    ActivityEntity = "user"
	EntityComment ActivityEntity = "comment"
)

// ActivityLog represents an activity log entry
type ActivityLog struct {
	ID         primitive.ObjectID  `bson:"_id,omitempty" json:"_id,omitempty"`
	UserID     primitive.ObjectID  `bson:"userId" json:"userId"`
	UserName   string              `bson:"userName" json:"userName"`
	UserAvatar string              `bson:"userAvatar,omitempty" json:"userAvatar,omitempty"`
	Action     ActivityAction      `bson:"action" json:"action"`
	Entity     ActivityEntity      `bson:"entity" json:"entity"`
	EntityID   primitive.ObjectID  `bson:"entityId" json:"entityId"`
	EntityName string              `bson:"entityName" json:"entityName"`
	ProjectID  *primitive.ObjectID `bson:"projectId,omitempty" json:"projectId,omitempty"`
	Details    string              `bson:"details,omitempty" json:"details,omitempty"`
	CreatedAt  time.Time           `bson:"createdAt" json:"createdAt"`
}
