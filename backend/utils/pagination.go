package utils

import (
	"math"
	"strconv"

	"github.com/gin-gonic/gin"
)

// PaginationParams holds pagination query parameters
type PaginationParams struct {
	Page  int
	Limit int
	Skip  int64
}

// GetPagination extracts and validates pagination params from query string
func GetPagination(c *gin.Context) PaginationParams {
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if err != nil || limit < 1 || limit > 100 {
		limit = 10
	}

	skip := int64((page - 1) * limit)

	return PaginationParams{
		Page:  page,
		Limit: limit,
		Skip:  skip,
	}
}

// CalculatePages calculates total pages from total count and limit
func CalculatePages(total int64, limit int) int64 {
	return int64(math.Ceil(float64(total) / float64(limit)))
}
