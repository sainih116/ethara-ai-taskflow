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

type ActivityRepository struct {
	collection *mongo.Collection
}

func NewActivityRepository() *ActivityRepository {
	return &ActivityRepository{
		collection: database.GetCollection("activity_logs"),
	}
}

func (r *ActivityRepository) Create(ctx context.Context, log *models.ActivityLog) error {
	log.ID = primitive.NewObjectID()
	log.CreatedAt = time.Now()
	_, err := r.collection.InsertOne(ctx, log)
	return err
}

func (r *ActivityRepository) FindRecent(ctx context.Context, userID primitive.ObjectID, role string, limit int) ([]models.ActivityLog, error) {
	filter := bson.M{}
	if role != "admin" {
		filter["userId"] = userID
	}

	opts := options.Find().
		SetLimit(int64(limit)).
		SetSort(bson.D{{Key: "createdAt", Value: -1}})

	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var logs []models.ActivityLog
	if err := cursor.All(ctx, &logs); err != nil {
		return nil, err
	}
	return logs, nil
}

func (r *ActivityRepository) FindByProject(ctx context.Context, projectID primitive.ObjectID, skip int64, limit int) ([]models.ActivityLog, int64, error) {
	filter := bson.M{"projectId": projectID}
	opts := options.Find().
		SetSkip(skip).
		SetLimit(int64(limit)).
		SetSort(bson.D{{Key: "createdAt", Value: -1}})

	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var logs []models.ActivityLog
	if err := cursor.All(ctx, &logs); err != nil {
		return nil, 0, err
	}

	total, err := r.collection.CountDocuments(ctx, filter)
	return logs, total, err
}
