package chain

import (
	"fmt"
)

type InsufficientBalanceErr struct {
	CurBalance uint64
}

func (e InsufficientBalanceErr) Error() string {
	return fmt.Sprintf("current balance %d is insufficient", e.CurBalance)
}

type TimeOutErr struct {
}

func (TimeOutErr) Error() string {
	return "timeout"
}

type InvalidSignatureErr struct {
	TxnHash   string
	Signature string
}

func (e InvalidSignatureErr) Error() string {
	return fmt.Sprintf("signature %s is invalid for transaction %s", e.Signature, e.TxnHash)
}

type AlreadyRelayedPacket struct {
	SeqNum         uint64
	CurChainHeight uint64
}

func (e AlreadyRelayedPacket) Error() string {
	return fmt.Sprintf("packet with id %d aleady sent", e.SeqNum)
}
