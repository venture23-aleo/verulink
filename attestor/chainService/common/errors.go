package common

import (
	"fmt"
)

type TimeOutErr struct {
}

func (TimeOutErr) Error() string {
	return "timeout"
}

type InvalidSignatureErr struct {
	PktHash   string
	Signature string
}

func (e InvalidSignatureErr) Error() string {
	return fmt.Sprintf("signature %s is invalid for hash %s", e.Signature, e.PktHash)
}

type AlreadyRelayedPacket struct {
}

func (e AlreadyRelayedPacket) Error() string {
	return "packet aleady sent"
}
