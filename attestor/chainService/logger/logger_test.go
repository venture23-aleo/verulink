package logger

import (
	"fmt"
	"testing"
)

func TestLogger(t *testing.T) {
	prometheusGatewayURL = "https://prometheus.ibriz.ai:9096/metrics/job/dev-push-gateway"

	// attestorName := "attestor1"
	// srcChainId := "1"
	// pktSeq := 2
	// hash := "hash"
	// signature := "sign"
	chainId:= "1"

	// db_post{attestor="attestornameisthis"} 0

	// log := fmt.Sprintf("test_prometheus{attestor=%s} 1", attestorName)

	// PushLogsToPrometheus(log)

	// PushLogsToPrometheus(fmt.Sprintf("signing_service_request_fail{attestor=%s} 0", attestorName))

	type packet struct {
		a string
	}

	pkt := new(packet)
	pkt.a = "hello"

	log:=fmt.Sprintf("chainService_aleo_managePacket_retryCh{client=\"%s\",packet=\"%v\"} 1", chainId,pkt)
	PushLogsToPrometheus(log)

	//log2:= fmt.Sprintf("")

}
