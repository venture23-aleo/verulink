package logger

import (
	"fmt"
	"testing"
)

func TestLogger(t *testing.T) {
	prometheusGatewayURL = "https://prometheus.ibriz.ai:9096/metrics/job/dev-push-gateway"

	attestorName := "attestor1"
	srcChainId := "1"
	pktSeq := 2
	hash := "hash"
	signature := "sign"

	// db_post{attestor="attestornameisthis"} 0

	// log := fmt.Sprintf("test_prometheus{attestor=%s} 1", attestorName)

	// PushLogsToPrometheus(log)

	// PushLogsToPrometheus(fmt.Sprintf("signing_service_request_fail{attestor=%s} 0", attestorName))

	log := fmt.Sprintf("signing_service_request_passed{attestor=\"%s\",source_chain_id=\"%s\",sequence=\"%d\",hash=\"%s\",signature=\"%s\"} 1",
		attestorName, srcChainId, pktSeq, hash, signature)
	PushLogsToPrometheus(log)

}
