package chain

type ISender interface {
	Send()
}

type IReceiver interface {
	Subscribe() 
}