package attestor

import "testing"

func TestWriteConfig(t *testing.T) {
	WriteE2EConifg("../../chainService/config.yaml", "https://endpoints.omniatech.io/v1/eth/sepolia/public", "https://api.explorer.aleo.org/v1|testnet", 6243094, 17,false)
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

func TestBuildRelayImage(t *testing.T) {
	BuildRelayImage()
}
