package aleo

import (
	"context"
	"os/exec"
	"time"

	chainService "github.com/venture23-aleo/verulink/attestor/chainService/chain"
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

// HashAndSign returns the bhp246-hash of the screenedPacket and schnorr signature of the attestor
// on the hash of the screened packet
func HashAndSign(sp *chainService.ScreenedPacket) (hsh, signature string, err error) {
	hsh, err = hash(sp)
	if err != nil {
		return
	}

	signature, err = sign(hsh)
	if err != nil {
		return "", "", err
	}
	return
}

// hash returns the bhp256-hash of screenedPacket by calling a rust binary
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
