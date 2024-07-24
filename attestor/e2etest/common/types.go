package common

import "context"

type IClient interface {
	CreatePacket()
	TransferEther(ctx context.Context) error
}