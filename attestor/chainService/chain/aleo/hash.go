package aleo

import (
	"context"
	"os/exec"
	"strings"

	"github.com/venture23-aleo/attestor/chainService/chain"
)

const (
	aleohash    = "ALEOSignature"
	hashCommand = "hash"
	hashType    = "bhp256"
	hashOutput  = "field"
)

func hash(sp *chain.ScreenedPacket) string {
	aleoPacket := constructAleoPacket(sp.Packet)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	cmd := exec.CommandContext(ctx, aleohash, hashCommand, hashType, aleoPacket, hashOutput)
	output, err := cmd.Output()
	if err != nil {
		panic(err)
	}
	outputStr := string(output)
	outputStrSp := strings.Split(outputStr, ":: ")
	packetHash := outputStrSp[1]

	aleoPacketWithScreening := constructAleoScreeningPacket(packetHash, getAleoBool(sp.IsWhite))

	cmd = exec.CommandContext(ctx, aleohash, hashCommand, hashType, aleoPacketWithScreening, hashOutput)
	output, err = cmd.Output()
	if err != nil {
		panic(err)
	}
	outputStr = string(output)
	outputStrSp = strings.Split(outputStr, ":: ")
	packetHashWithScreening := outputStrSp[1]
	return packetHashWithScreening
}

func getAleoBool(isWhite bool) string {
	if isWhite {
		return "true"
	}
	return "false"
}
