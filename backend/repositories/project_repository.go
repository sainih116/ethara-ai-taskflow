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

type ProjectRepository struct {
	collection *mongo.Collection
}

func NewProjectRepository() *ProjectRepository {
	return &ProjectRepository{
		collection: database.GetCollection("projects"),
	}
}

func (r *ProjectRepository) Create(ctx context.Context, project *models.Project) error {
	project.ID = primitive.NewObjectID()
	project.CreatedAt = time.Now()
	project.UpdatedAt = time.Now()
	if project.Status == "" {
		project.Status = models.ProjectStatusActive
	}

	_, err := r.collection.InsertOne(ctx, project)
	return err
}

func (r *ProjectRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*models.Project, error) {
	var project models.Project
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&project)
	if err != nil {
		return nil, err
	}
	return &project, nil
}

// FindAll returns projects accessible to a user (admin sees all, member sees their own)
func (r *ProjectRepository) FindAll(ctx context.Context, userID primitive.ObjectID, role string, skip int64, limit int, status string) ([]models.Project, int64, error) {
	filter := bson.M{}

	if role != "admin" {
		filter["$or"] = []bson.M{
			{"createdBy": userID},
			{"members": userID},
		}
	}

	if status != "" {
		filter["status"] = status
	}

	opts := options.Find().
		SetSkip(skip).
		SetLimit(int64(limit)).
		SetSort(bson.D{{Key: "createdAt", Value: -1}})

	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var projects []models.Project
	if err := cursor.All(ctx, &projects); err != nil {
		return nil, 0, err
	}

	total, err := r.collection.CountDocuments(ctx, filter)
	return projects, total, err
}

func (r *ProjectRepository) Update(ctx context.Context, id primitive.ObjectID, update bson.M) error {
	update["updatedAt"] = time.Now()
	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": update})
	return err
}

func (r *ProjectRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}

func (r *ProjectRepository) AddMember(ctx context.Context, projectID, userID primitive.ObjectID) error {
	_, err := r.collection.UpdateOne(ctx,
		bson.M{"_id": projectID},
		bson.M{
			"$addToSet": bson.M{"members": userID},
			"$set":      bson.M{"updatedAt": time.Now()},
		},
	)
	return err
}

func (r *ProjectRepository) RemoveMember(ctx context.Context, projectID, userID primitive.ObjectID) error {
	_, err := r.collection.UpdateOne(ctx,
		bson.M{"_id": projectID},
		bson.M{
			"$pull": bson.M{"members": userID},
			"$set":  bson.M{"updatedAt": time.Now()},
		},
	)
	return err
}

func (r *ProjectRepository) CountByUser(ctx context.Context, userID primitive.ObjectID) (int64, error) {
	return r.collection.CountDocuments(ctx, bson.M{
		"$or": []bson.M{
			{"createdBy": userID},
			{"members": userID},
		},
	})
}
