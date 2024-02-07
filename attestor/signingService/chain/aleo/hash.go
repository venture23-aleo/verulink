package aleo

import (
	"context"
	"os/exec"
	"time"

	chainService "github.com/venture23-aleo/aleo-bridge/attestor/chainService/chain"
)

const (
	command    = "ahs" // aleo hasher + signer
	hashCmd    = "hash"
	hashType   = "bhp256"
	hashOutput = "field"
)

const (
	aleoTrue  = "true"
	aleoFalse = "false"
)

func HashAndSign(sp *chainService.ScreenedPacket) (signature string, err error) {
	h, err := hash(sp)
	if err != nil {
		return "", err
	}

	return sign(h)
}

func hash(sp *chainService.ScreenedPacket) (hash string, err error) {
	aleoPacket := constructAleoPacket(sp.Packet)

	ctx, cancel := context.WithTimeout(context.TODO(), time.Second*5)
	defer cancel()

	cmd := exec.CommandContext(ctx, command, hashCmd, hashType, aleoPacket, hashOutput)
	output, err := cmd.Output()
	if err != nil {
		return "", err
	}

	packetHash := string(output)

	aleoPacketWithScreening := constructAleoScreeningPacket(packetHash, getAleoBool(sp.IsWhite))

	cmd = exec.CommandContext(ctx, command, hashCmd, hashType, aleoPacketWithScreening, hashOutput)
	output, err = cmd.Output()
	if err != nil {
		return "", err
	}

	packetHashWithScreening := string(output)
	return packetHashWithScreening, nil
}

func getAleoBool(isWhite bool) string {
	if isWhite {
		return aleoTrue
	}
	return aleoFalse
}
