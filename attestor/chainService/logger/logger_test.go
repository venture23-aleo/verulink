package logger

import (
	"fmt"
	"testing"
	"time"
)

func TestLogger(t *testing.T) {
	prometheusGatewayURL = "https://prometheus.ibriz.ai:9096/metrics/job/dev-push-gateway"

	attestorName := "attestor3"
	srcChainId := "12348788"
	dstChainId := "8996999"
	sequence := 344

	log := fmt.Sprintf("post_signed_packet_to_db_service{attestor=\"%s\",source_chain_id=\"%s\",dest_chain_id=\"%s\",sequence=\"%d\"} 0",
		attestorName, srcChainId, dstChainId, sequence)

	PushLogsToPrometheus(log)

	//log2:= fmt.Sprintf("")

}

func TestLogger2(t *testing.T) {
	prometheusGatewayURL = "https://prometheus.ibriz.ai:9096/metrics/job/dev-push-gateway"

	attestorName := "attestor3"
	srcChainId := "12345678"
	sequence := 677
	hash := "4589865719031912816933224268177703544737897545797150955810420096139827056029fiele"
	sign := "sign1fxs3p44vv5aesvjmt6ljpsn43esp0t6q6yaumw90cuf2v8espuq474am2ndgm8aukf9rwjsux9agz5j02zqxrjz0cr25a5vtxdmwyq2qdjw2pe8k4xlkncmertlfmug7vjzqn88v7klz3htq94p48ghezqq4d9mmsnh9kzpy2y33x6j788xp2llppfp6v0kgwgpdxs5208vqc92aeqs"

	log := fmt.Sprintf("signing_service_request{attestor=\"%s\",source_chain_id=\"%s\",sequence=\"%d\",hash=\"%s\",signature=\"%s\"} 0",
		attestorName, srcChainId, sequence, hash, sign)

	duration := 15 * time.Second

	ticker := time.NewTicker(duration)
	defer ticker.Stop()

	PushLogsToPrometheus(log)

	//log2:= fmt.Sprintf("")

}

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
