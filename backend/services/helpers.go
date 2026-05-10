package services

import (
	"errors"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// parseObjectID converts a hex string to ObjectID
func parseObjectID(id string) (primitive.ObjectID, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return primitive.NilObjectID, errors.New("invalid ID format")
	}
	return oid, nil
}
