package database

import (
	"context"
	"log"
	"time"

	"github.com/teamtaskmanager/backend/config"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

var DB *mongo.Database
var Client *mongo.Client

// Connect establishes a connection to the local MongoDB instance
func Connect() {
	cfg := config.AppConfig

	if cfg.MongoURI == "" {
		log.Fatal("❌  MONGODB_URI is not set")
	}

	clientOpts := options.Client().
		ApplyURI(cfg.MongoURI).
		SetConnectTimeout(10 * time.Second).
		SetServerSelectionTimeout(10 * time.Second).
		SetSocketTimeout(30 * time.Second)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, clientOpts)
	if err != nil {
		log.Fatalf("❌  Failed to create MongoDB client: %v", err)
	}

	pingCtx, pingCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer pingCancel()

	if err := client.Ping(pingCtx, readpref.Primary()); err != nil {
		log.Fatalf("❌  MongoDB ping failed — is MongoDB running on %s? Error: %v", cfg.MongoURI, err)
	}

	Client = client
	DB = client.Database(cfg.DBName)

	log.Printf("✅  Connected to MongoDB  →  %s", cfg.MongoURI)
	log.Printf("✅  Active database       →  %s", cfg.DBName)

	createIndexes()
}

// Disconnect closes the MongoDB connection gracefully
func Disconnect() {
	if Client == nil {
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := Client.Disconnect(ctx); err != nil {
		log.Printf("⚠️   Error disconnecting MongoDB: %v", err)
		return
	}
	log.Println("✅  MongoDB connection closed")
}

// GetCollection returns a named collection from the active database
func GetCollection(name string) *mongo.Collection {
	return DB.Collection(name)
}

// Ping verifies the connection is still alive
func Ping() error {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	return Client.Ping(ctx, readpref.Primary())
}

// createIndexes builds all performance indexes on startup
func createIndexes() {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// employees (was: users)
	empCol := GetCollection("employees")
	if _, err := empCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true).SetName("employees_email_unique"),
	}); err != nil {
		log.Printf("⚠️   employees index: %v", err)
	}

	// projects
	projCol := GetCollection("projects")
	projIdx := []mongo.IndexModel{
		{Keys: bson.D{{Key: "createdBy", Value: 1}}, Options: options.Index().SetName("projects_createdBy")},
		{Keys: bson.D{{Key: "members", Value: 1}}, Options: options.Index().SetName("projects_members")},
		{Keys: bson.D{{Key: "status", Value: 1}}, Options: options.Index().SetName("projects_status")},
		{Keys: bson.D{{Key: "department", Value: 1}}, Options: options.Index().SetName("projects_department")},
	}
	if _, err := projCol.Indexes().CreateMany(ctx, projIdx); err != nil {
		log.Printf("⚠️   projects indexes: %v", err)
	}

	// tasks
	taskCol := GetCollection("tasks")
	taskIdx := []mongo.IndexModel{
		{Keys: bson.D{{Key: "projectId", Value: 1}}, Options: options.Index().SetName("tasks_projectId")},
		{Keys: bson.D{{Key: "assignedTo", Value: 1}}, Options: options.Index().SetName("tasks_assignedTo")},
		{Keys: bson.D{{Key: "status", Value: 1}}, Options: options.Index().SetName("tasks_status")},
		{Keys: bson.D{{Key: "dueDate", Value: 1}}, Options: options.Index().SetName("tasks_dueDate")},
		{Keys: bson.D{{Key: "priority", Value: 1}}, Options: options.Index().SetName("tasks_priority")},
	}
	if _, err := taskCol.Indexes().CreateMany(ctx, taskIdx); err != nil {
		log.Printf("⚠️   tasks indexes: %v", err)
	}

	// activity_logs
	actCol := GetCollection("activity_logs")
	actIdx := []mongo.IndexModel{
		{Keys: bson.D{{Key: "userId", Value: 1}}, Options: options.Index().SetName("activity_userId")},
		{Keys: bson.D{{Key: "projectId", Value: 1}}, Options: options.Index().SetName("activity_projectId")},
		{Keys: bson.D{{Key: "createdAt", Value: -1}}, Options: options.Index().SetName("activity_createdAt")},
	}
	if _, err := actCol.Indexes().CreateMany(ctx, actIdx); err != nil {
		log.Printf("⚠️   activity_logs indexes: %v", err)
	}

	// notifications
	notifCol := GetCollection("notifications")
	notifIdx := []mongo.IndexModel{
		{Keys: bson.D{{Key: "userId", Value: 1}}, Options: options.Index().SetName("notif_userId")},
		{Keys: bson.D{{Key: "read", Value: 1}}, Options: options.Index().SetName("notif_read")},
		{Keys: bson.D{{Key: "createdAt", Value: -1}}, Options: options.Index().SetName("notif_createdAt")},
	}
	if _, err := notifCol.Indexes().CreateMany(ctx, notifIdx); err != nil {
		log.Printf("⚠️   notifications indexes: %v", err)
	}

	// departments
	deptCol := GetCollection("departments")
	if _, err := deptCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "name", Value: 1}},
		Options: options.Index().SetUnique(true).SetName("departments_name_unique"),
	}); err != nil {
		log.Printf("⚠️   departments index: %v", err)
	}

	log.Println("✅  Database indexes created / verified")
}
