package relay

import (
	"encoding/hex"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/rpc"

	common "github.com/venture23-aleo/aleo-bridge/validators/common/wallet"
	"golang.org/x/crypto/sha3"
)

type ChainOrRelay int8

const (
	Chain ChainOrRelay = iota + 1
	Relay
)

type ActionType int8

const (
	Register ActionType = iota + 1
	Stop
)

type ChainArg struct {
	Name string
}

func (c ChainArg) String() string {
	return c.Name
}

type RelayArg struct {
	SrcChain, DestChain string
}

func (r RelayArg) String() string {
	return r.SrcChain + "-" + r.DestChain
}

type Arg struct {
	Chain     ChainArg
	Relays    []RelayArg
	ArgType   ChainOrRelay
	Action    ActionType
	Signature string
}

func (a Arg) String() string {
	s := fmt.Sprint(a.Chain)
	for _, r := range a.Relays {
		s += fmt.Sprint(r)
	}
	s += fmt.Sprintf("%d%d", a.ArgType, a.Action)
	return s
}

func (a Arg) GetHash() string {
	h := sha3.New256()
	h.Write([]byte(fmt.Sprint(a)))
	b := h.Sum(nil)
	return hex.EncodeToString(b)
}

func (a Arg) VerifySignature(pubKey string) bool {
	hash := a.GetHash()
	_ = hash
	// return verifySignature(pubKey,a.Signature, hash)
	return false
}

type Response struct {
}

type Handler struct {
	pubKey string
}

func (h *Handler) Call(arg *Arg, response *Response) error {
	if !arg.VerifySignature(h.pubKey) {
		return errors.New("invalid signature")
	}

	if err := validateArgument(arg); err != nil {
		return err
	}

	if arg.ArgType == Chain {
		return chainHandler(arg.Chain.Name, arg.Action)
	}
	return relaysHandler(arg.Relays, arg.Action)
}

func RunRpcServer(pubKey, networkAdd string) {
	if !common.IsValidPubKey(pubKey) {
		panic("invalid public key")
	}
	handler := new(Handler)
	handler.pubKey = pubKey
	rpc.Register(handler)
	l, err := net.Listen("tcp", networkAdd)
	if err != nil {
		panic(err)
	}

	http.Serve(l, nil)

}

func validateArgument(arg *Arg) error {
	switch arg.ArgType {
	case Chain:
		if arg.Chain.Name == "" {
			return errors.New("chain name is empty")
		}
	case Relay:
		if len(arg.Relays) == 0 {
			return errors.New("empty relays to take action upon")
		}
		for _, r := range arg.Relays {
			if r.DestChain == r.SrcChain {
				return fmt.Errorf("source chain and dest chain cannot be equal. Chain: %s", r.DestChain)
			}
			if r.DestChain == "" {
				return fmt.Errorf("dest chain name is empty")
			}
			if r.SrcChain == "" {
				return fmt.Errorf("source chain name is empty")
			}
		}
	default:
		return fmt.Errorf("invalid argType %d", arg.ArgType)
	}

	switch arg.Action {
	case Register, Stop:
	default:
		return fmt.Errorf("invalid action: %d", arg.Action)
	}

	return nil
}
