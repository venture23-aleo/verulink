package dbservice

import (
	"context"
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetPacketInfo(t *testing.T) {
	collector := NewDataBase("https://aleobridge-dbservice-develop.b08qlu4v33brq.us-east-1.cs.amazonlightsail.com/")
	pktInfo, err := collector.GetPacketInfo(context.Background(), "568", "28556963657430695", "6694886634403")
	assert.NoError(t, err)
	fmt.Printf("%+v", pktInfo)
}
