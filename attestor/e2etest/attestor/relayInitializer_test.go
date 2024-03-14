package attestor

import "testing"

func TestWriteConfig(t *testing.T) {
	WriteE2EConifg("/home/sheldor/github.com/venture23-aleo/new-architecture/aleo-bridge/attestor/chainService/config.yaml", "https://endpoints.omniatech.io/v1/eth/sepolia/public", "https://api.explorer.aleo.org/v1|testnet3", 5433859, 17)
}

func TestBuildDockerImage(t *testing.T) {
	BuildRelayImage()
}

func TestRunRelayImage(t *testing.T) {
	RunRelayImage("")
}

func TestStopRelayImage(t *testing.T) {
	StopRelayImage("")
}

func TestBuildRelayImage(t *testing.T) {
	BuildRelayImage()
}
