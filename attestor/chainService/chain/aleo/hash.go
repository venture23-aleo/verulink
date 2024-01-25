package aleo

import (
	"context"
	"os/exec"

	"github.com/venture23-aleo/attestor/chainService/chain"
)

const (
	aleohash    = "ALEOSignature"
	hashCommand = "hash"
	hashType    = "bhp256"
	hashOutput  = "field"
)

const (
	aleoTrue  = "true"
	aleoFalse = "false"
)

func hash(sp *chain.ScreenedPacket) string {
	aleoPacket := constructAleoPacket(sp.Packet)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	cmd := exec.CommandContext(ctx, aleohash, hashCommand, hashType, aleoPacket, hashOutput)
	output, _ := cmd.Output()

	packetHash := string(output)

	aleoPacketWithScreening := constructAleoScreeningPacket(packetHash, getAleoBool(sp.IsWhite))

	cmd = exec.CommandContext(ctx, aleohash, hashCommand, hashType, aleoPacketWithScreening, hashOutput)
	output, _ = cmd.Output()

	packetHashWithScreening := string(output)
	return packetHashWithScreening
}

func getAleoBool(isWhite bool) string {
	if isWhite {
		return aleoTrue
	}
	return aleoFalse
}
