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

type ErrPacketNotFound struct {
	SeqNum      uint64
	SourceChain string
	DestChain   string
	Height      uint64
}

func (e ErrPacketNotFound) Error() string {
	return fmt.Sprintf("packet not found for sequence num %d. source: %s, destination: %s, height: %d",
		e.SeqNum, e.SourceChain, e.DestChain, e.Height)
}

func (e ErrPacketNotFound) Is(err error) bool {
	_, ok := err.(ErrPacketNotFound)
	return ok
}
