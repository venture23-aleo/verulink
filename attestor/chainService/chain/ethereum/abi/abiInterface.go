package abi

import (
	"math/big"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/core/types"
)

type ABIInterface interface {
	OutgoingPackets(opts *bind.CallOpts, arg0 *big.Int, arg1 *big.Int) (struct {
		Version            *big.Int
		Sequence           *big.Int
		SourceTokenService PacketLibraryInNetworkAddress
		DestTokenService   PacketLibraryOutNetworkAddress
		Message            PacketLibraryOutTokenMessage
		Height             *big.Int
	}, error)
	ReceivePacket(opts *bind.TransactOpts, packet PacketLibraryInPacket) (*types.Transaction, error)
}
