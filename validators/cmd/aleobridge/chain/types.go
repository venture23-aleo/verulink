package chain

import "context"

type ISender interface {
	Send(ctx context.Context)
}

type IReceiver interface {
	Subscribe(ctx context.Context) 
}