package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ulule/limiter/v3"
	mgin "github.com/ulule/limiter/v3/drivers/middleware/gin"
	"github.com/ulule/limiter/v3/drivers/store/memory"
)

// RateLimiter creates a rate limiting middleware
// rate: number of requests allowed per period
func RateLimiter(requestsPerMinute int64) gin.HandlerFunc {
	rate := limiter.Rate{
		Period: 1 * time.Minute,
		Limit:  requestsPerMinute,
	}

	store := memory.NewStore()
	instance := limiter.New(store, rate)

	return mgin.NewMiddleware(instance)
}

// StrictRateLimiter for auth endpoints (more restrictive)
func StrictRateLimiter() gin.HandlerFunc {
	return RateLimiter(10) // 10 requests per minute for auth
}

// StandardRateLimiter for general API endpoints
func StandardRateLimiter() gin.HandlerFunc {
	return RateLimiter(100) // 100 requests per minute
}
