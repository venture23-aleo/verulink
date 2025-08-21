package attestor

import "testing"

func TestWriteConfig(t *testing.T) {
	WriteE2EConifg("config.yaml", "https://eth-sepolia.g.alchemy.com/v2/WddzdzI2o9S3COdT73d5w6AIogbKq4X-", "wss://base-sepolia.drpc.org", 
	"https://api.explorer.aleo.org/v1|testnet", 6243094,22689851, 1,false)
}

func TestBuildDockerImage(t *testing.T) {
	BuildRelayImage()
}

func TestRunRelayImage(t *testing.T) {
	RunRelayImage("../../compose.yaml")
}

func TestStopRelayImage(t *testing.T) {
	StopRelayImage("../../compose.yaml")
}
