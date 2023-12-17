package relay

import "context"

type notfType int

const (
	insufficientBalance notfType = iota
)

func (r *relay) notifyDelegator(ctx context.Context, nType notfType) error {
	switch nType {
	case insufficientBalance:
		//
	}
	return nil
}
