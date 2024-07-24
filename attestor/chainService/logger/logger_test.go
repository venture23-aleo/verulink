package logger

import (
	"fmt"
	"testing"
	"time"
)

// TODO: add tests for promethues metrics push


func TestCheckHealthInInterval(t *testing.T) {
    duration := 1 * time.Second
    ticker := time.NewTicker(duration)
    defer ticker.Stop()

    done := make(chan struct{})
    defer close(done)

    go func() {
        for {
            select {
            case <-ticker.C:
                fmt.Println("the ticker is hereee")
                // Add your health checking logic here
            case <-done:
                return
            }
        }
    }()

    // Add any test assertions or logic here
    // For example, you could wait for a certain number of ticks
    time.Sleep(3 * duration) // Wait for 3 minutes

    // At this point, the test is finished, and the ticker will stop automatically
}
