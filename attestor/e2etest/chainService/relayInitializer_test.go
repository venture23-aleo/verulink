package chainservice

import "testing"

func TestWriteConfig(t *testing.T) {
	WriteE2EConifg()
}

func TestBuildDockerImage(t *testing.T) {
	BuildRelayImage()
}