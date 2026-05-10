package repositories

import (
	"context"
	"time"

	"github.com/teamtaskmanager/backend/database"
	"github.com/teamtaskmanager/backend/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type TaskRepository struct {
	collection *mongo.Collection
}

func NewTaskRepository() *TaskRepository {
	return &TaskRepository{
		collection: database.GetCollection("tasks"),
	}
}

func (r *TaskRepository) Create(ctx context.Context, task *models.Task) error {
	task.ID = primitive.NewObjectID()
	task.CreatedAt = time.Now()
	task.UpdatedAt = time.Now()
	if task.Status == "" {
		task.Status = models.TaskStatusTodo
	}
	if task.Priority == "" {
		task.Priority = models.TaskPriorityMedium
	}

	_, err := r.collection.InsertOne(ctx, task)
	return err
}

func (r *TaskRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*models.Task, error) {
	var task models.Task
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&task)
	if err != nil {
		return nil, err
	}
	return &task, nil
}

// TaskFilter holds filtering options for tasks
type TaskFilter struct {
	ProjectID  string
	AssignedTo string
	Status     string
	Priority   string
	Search     string
}

func (r *TaskRepository) FindAll(ctx context.Context, userID primitive.ObjectID, role string, filter TaskFilter, skip int64, limit int) ([]models.Task, int64, error) {
	query := bson.M{}

	if filter.ProjectID != "" {
		if pid, err := primitive.ObjectIDFromHex(filter.ProjectID); err == nil {
			query["projectId"] = pid
		}
	}

	if filter.AssignedTo != "" {
		if aid, err := primitive.ObjectIDFromHex(filter.AssignedTo); err == nil {
			query["assignedTo"] = aid
		}
	} else if role != "admin" {
		// Members only see tasks assigned to them
		query["assignedTo"] = userID
	}

	if filter.Status != "" {
		query["status"] = filter.Status
	}

	if filter.Priority != "" {
		query["priority"] = filter.Priority
	}

	if filter.Search != "" {
		query["$or"] = []bson.M{
			{"title": bson.M{"$regex": filter.Search, "$options": "i"}},
			{"description": bson.M{"$regex": filter.Search, "$options": "i"}},
		}
	}

	opts := options.Find().
		SetSkip(skip).
		SetLimit(int64(limit)).
		SetSort(bson.D{{Key: "order", Value: 1}, {Key: "createdAt", Value: -1}})

	cursor, err := r.collection.Find(ctx, query, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var tasks []models.Task
	if err := cursor.All(ctx, &tasks); err != nil {
		return nil, 0, err
	}

	total, err := r.collection.CountDocuments(ctx, query)
	return tasks, total, err
}

func (r *TaskRepository) FindByProject(ctx context.Context, projectID primitive.ObjectID) ([]models.Task, error) {
	opts := options.Find().SetSort(bson.D{{Key: "order", Value: 1}, {Key: "createdAt", Value: -1}})
	cursor, err := r.collection.Find(ctx, bson.M{"projectId": projectID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var tasks []models.Task
	if err := cursor.All(ctx, &tasks); err != nil {
		return nil, err
	}
	return tasks, nil
}

func (r *TaskRepository) Update(ctx context.Context, id primitive.ObjectID, update bson.M) error {
	update["updatedAt"] = time.Now()
	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": update})
	return err
}

func (r *TaskRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}

func (r *TaskRepository) DeleteByProject(ctx context.Context, projectID primitive.ObjectID) error {
	_, err := r.collection.DeleteMany(ctx, bson.M{"projectId": projectID})
	return err
}

func (r *TaskRepository) AddComment(ctx context.Context, taskID primitive.ObjectID, comment models.Comment) error {
	comment.ID = primitive.NewObjectID()
	comment.CreatedAt = time.Now()

	_, err := r.collection.UpdateOne(ctx,
		bson.M{"_id": taskID},
		bson.M{
			"$push": bson.M{"comments": comment},
			"$set":  bson.M{"updatedAt": time.Now()},
		},
	)
	return err
}

// DashboardStats holds aggregated statistics
type DashboardStats struct {
	TotalTasks      int64 `json:"totalTasks"`
	CompletedTasks  int64 `json:"completedTasks"`
	PendingTasks    int64 `json:"pendingTasks"`
	InProgressTasks int64 `json:"inProgressTasks"`
	OverdueTasks    int64 `json:"overdueTasks"`
}

func (r *TaskRepository) GetStats(ctx context.Context, userID primitive.ObjectID, role string) (*DashboardStats, error) {
	matchStage := bson.M{}
	if role != "admin" {
		matchStage["assignedTo"] = userID
	}

	now := time.Now()

	total, _ := r.collection.CountDocuments(ctx, matchStage)

	completedFilter := bson.M{"status": models.TaskStatusDone}
	if role != "admin" {
		completedFilter["assignedTo"] = userID
	}
	completed, _ := r.collection.CountDocuments(ctx, completedFilter)

	pendingFilter := bson.M{"status": bson.M{"$in": []string{string(models.TaskStatusTodo), string(models.TaskStatusInProgress), string(models.TaskStatusInReview)}}}
	if role != "admin" {
		pendingFilter["assignedTo"] = userID
	}
	pending, _ := r.collection.CountDocuments(ctx, pendingFilter)

	inProgressFilter := bson.M{"status": models.TaskStatusInProgress}
	if role != "admin" {
		inProgressFilter["assignedTo"] = userID
	}
	inProgress, _ := r.collection.CountDocuments(ctx, inProgressFilter)

	overdueFilter := bson.M{
		"dueDate": bson.M{"$lt": now},
		"status":  bson.M{"$ne": models.TaskStatusDone},
	}
	if role != "admin" {
		overdueFilter["assignedTo"] = userID
	}
	overdue, _ := r.collection.CountDocuments(ctx, overdueFilter)

	return &DashboardStats{
		TotalTasks:      total,
		CompletedTasks:  completed,
		PendingTasks:    pending,
		InProgressTasks: inProgress,
		OverdueTasks:    overdue,
	}, nil
}

// GetTasksByPriority returns task counts grouped by priority
func (r *TaskRepository) GetTasksByPriority(ctx context.Context, userID primitive.ObjectID, role string) ([]bson.M, error) {
	matchStage := bson.D{{Key: "$match", Value: bson.M{}}}
	if role != "admin" {
		matchStage = bson.D{{Key: "$match", Value: bson.M{"assignedTo": userID}}}
	}

	pipeline := mongo.Pipeline{
		matchStage,
		{{Key: "$group", Value: bson.M{
			"_id":   "$priority",
			"count": bson.M{"$sum": 1},
		}}},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []bson.M
	cursor.All(ctx, &results)
	return results, nil
}

// GetCompletionTrend returns task completion data for the last N days
func (r *TaskRepository) GetCompletionTrend(ctx context.Context, userID primitive.ObjectID, role string, days int) ([]bson.M, error) {
	startDate := time.Now().AddDate(0, 0, -days)

	matchFilter := bson.M{
		"status":    models.TaskStatusDone,
		"updatedAt": bson.M{"$gte": startDate},
	}
	if role != "admin" {
		matchFilter["assignedTo"] = userID
	}

	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: matchFilter}},
		{{Key: "$group", Value: bson.M{
			"_id": bson.M{
				"$dateToString": bson.M{
					"format": "%Y-%m-%d",
					"date":   "$updatedAt",
				},
			},
			"count": bson.M{"$sum": 1},
		}}},
		{{Key: "$sort", Value: bson.D{{Key: "_id", Value: 1}}}},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []bson.M
	cursor.All(ctx, &results)
	return results, nil
}
