package logger

import (
	"fmt"
	"testing"
	"time"
)



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
                
            case <-done:
                return
            }
        }
    }()

    time.Sleep(3 * duration) // Wait for 3 minutes


}
