package main

import (
	"os"
	"syscall"
)

func getKillSignals() []os.Signal {
	return []os.Signal{
		syscall.SIGINT,
		syscall.SIGTERM,
		syscall.SIGQUIT,
		syscall.SIGILL,
		syscall.SIGTRAP,
		syscall.SIGABRT,
		syscall.SIGSTKFLT,
		syscall.SIGSYS,
	}
}

func getIgnoreSignals() []os.Signal {
	return []os.Signal{
		syscall.SIGHUP,
		syscall.SIGALRM,
		syscall.SIGVTALRM,
		syscall.SIGUSR1,
		syscall.SIGUSR2,
	}
}
