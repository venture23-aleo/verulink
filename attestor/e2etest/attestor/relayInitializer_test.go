package chainservice

import "testing"

func TestWriteConfig(t *testing.T) {
	WriteE2EConifg()
}

func TestBuildDockerImage(t *testing.T) {
	BuildRelayImage()
}

func TestRunRelayImage(t *testing.T) {
	RunRelayImage()
}

func TestStopRelayImage(t *testing.T) {
	StopRelayImage()
}

func TestBuildRelayImage(t *testing.T) {
	BuildRelayImage()
}