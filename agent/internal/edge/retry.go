package edge

import (
	"math"
	"time"
)

type RetryPolicy struct {
	MaxRetries    int
	InitialDelay  time.Duration
	MaxDelay      time.Duration
	Multiplier    float64
	JitterPercent float64
}

func DefaultRetryPolicy() RetryPolicy {
	return RetryPolicy{
		MaxRetries:    5,
		InitialDelay:  1 * time.Second,
		MaxDelay:      5 * time.Minute,
		Multiplier:    2.0,
		JitterPercent: 0.1,
	}
}

func (r RetryPolicy) GetDelay(attempt int) time.Duration {
	if attempt <= 0 {
		return r.InitialDelay
	}

	delay := float64(r.InitialDelay) * math.Pow(r.Multiplier, float64(attempt-1))
	if delay > float64(r.MaxDelay) {
		delay = float64(r.MaxDelay)
	}

	jitter := delay * r.JitterPercent
	delay += jitter * (0.5 - float64(time.Now().UnixNano()%100)/100.0)

	return time.Duration(delay)
}

type CircuitBreaker struct {
	failures      int
	threshold     int
	resetTimeout  time.Duration
	lastFailure   time.Time
	state         string
}

func NewCircuitBreaker(threshold int, resetTimeout time.Duration) *CircuitBreaker {
	return &CircuitBreaker{
		threshold:    threshold,
		resetTimeout: resetTimeout,
		state:       "closed",
	}
}

func (cb *CircuitBreaker) Allow() bool {
	switch cb.state {
	case "closed":
		return true
	case "open":
		if time.Since(cb.lastFailure) > cb.resetTimeout {
			cb.state = "half-open"
			return true
		}
		return false
	case "half-open":
		return true
	}
	return true
}

func (cb *CircuitBreaker) Success() {
	cb.failures = 0
	cb.state = "closed"
}

func (cb *CircuitBreaker) Failure() {
	cb.failures++
	cb.lastFailure = time.Now()
	if cb.failures >= cb.threshold {
		cb.state = "open"
	}
}
