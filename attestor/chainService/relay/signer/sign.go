package signer

import (
	"github.com/venture23-aleo/attestor/chainService/chain"
)

type SignI interface {
	SignScreenedPacket(sp *chain.ScreenedPacket, hash chain.HashFunc) (string, error)
}

var s SignI

type signService struct{}

func (s *signService) SignScreenedPacket(sp *chain.ScreenedPacket, hash chain.HashFunc) (string, error) {

	h := hash(sp)
	_ = h
	// send this hash to sign for signing service

	return "", nil
}

func SetupSigner() error {
	s = nil
	return nil
}

func GetSigner() SignI {
	return s
}
