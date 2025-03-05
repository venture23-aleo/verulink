package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"os/exec"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/venture23-aleo/attestor/e2etest/attestor"
	_ "github.com/venture23-aleo/attestor/e2etest/chains/aleo"
	_ "github.com/venture23-aleo/attestor/e2etest/chains/ethereum"
	"github.com/venture23-aleo/attestor/e2etest/common"
	testsuite "github.com/venture23-aleo/attestor/e2etest/testSuite"
)

const (
	ethereum = "ethereum"
	aleo     = "aleo"
	base     = "base"
)

var (
	testCycle        int
	configPath       string
	benchMarkRelayer bool
)

func init() {
	flag.IntVar(&testCycle, "testCycle", 1, "test cycle")
	flag.BoolVar(&benchMarkRelayer, "benchMark", false, "benchmark the relayer")
}

func main() {
	flag.Parse()
	config, err := common.InitConfig("config.yaml")
	if err != nil {
		panic(err)
	}
	_ = config

	testSuite := testsuite.NewE2ETest()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	var aleoEndpoint string
	var ethEndpoint string
	for _, v := range config.Chains {
		if v.Name == ethereum {
			ethEndpoint = v.NodeUrl
		}
		if v.Name == aleo {
			aleoEndpoint = v.NodeUrl
		}
	}

	// setup reverse proxy servers to connect to the
	aleoUrls := strings.Split(aleoEndpoint, "|")
	fmt.Println(aleoUrls[0])

	cmdAleo := exec.Command("../proxy/proxy", "--remoteUrl", aleoUrls[0], "--port", "3002", "--benchMark", strconv.FormatBool(benchMarkRelayer), "&!")

	proxyServerLog, err := os.OpenFile("server.log", os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0666)
	if err != nil {
		log.Fatal(err)
	}
	defer proxyServerLog.Close()

	cmdAleo.Stdout = proxyServerLog
	cmdAleo.Stderr = proxyServerLog

	err = cmdAleo.Start()
	if err != nil {
		panic(err)
	}
	defer cmdAleo.Process.Kill()

	// cmdEthereum := exec.Command("../proxy/proxy", "--remoteUrl", ethEndpoint, "--port", "3001", "&!")
	// err = cmdEthereum.Start()
	// if err != nil {
	// 	panic(err)
	// }
	// defer cmdEthereum.Process.Kill()

	time.Sleep(time.Second * 5)

	fmt.Println(benchMarkRelayer)

	attestor.WriteE2EConifg(config.WriteConfigPath, ethEndpoint, "", aleoEndpoint, 6694886634403, 0, 1, benchMarkRelayer)

	// / setting up signal handling
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		sig := <-sigCh
		log.Printf("Received signal: %s", sig)
		cancel()
		cmdAleo.Process.Kill()
		// cmdEthereum.Process.Kill()
	}()

	if benchMarkRelayer {
		fmt.Println("The benchmark test is running")

		signingServiceCmd := exec.CommandContext(context.Background(), "../signingService/signingService", "--kp", "../signingService/secrets.yaml", "--config", "../signingService/config.yaml", "--address", "0.0.0.0", "--port", "8080")

		signingLogFile, err := os.OpenFile("signingService.log", os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0666)
		if err != nil {
			log.Fatal(err)
		}
		defer signingLogFile.Close()

		signingServiceCmd.Stdout = signingLogFile
		signingServiceCmd.Stderr = signingLogFile

		// Start the chain service
		chainServiceCmd := exec.CommandContext(context.Background(), "../chainService/chainService", "--config", "../chainService/config.yaml", "--clean", "false")

		chainLogFile, err := os.OpenFile("chainService.log", os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0666)
		if err != nil {
			log.Fatal(err)
		}
		defer chainLogFile.Close()

		chainServiceCmd.Stdout = chainLogFile
		chainServiceCmd.Stderr = chainLogFile

		if err = signingServiceCmd.Start(); err != nil {
			log.Fatal(err)
		}

		time.Sleep(time.Second * 5)

		if err = chainServiceCmd.Start(); err != nil {
			log.Fatal(err)
		}

		fmt.Println("Chain service started")

		<-ctx.Done()
	} else {
		fmt.Println("E2E test is starting ")
		for i := 0; i < testCycle; i++ {
			attestor.RunRelayImage("../compose.yaml")
			for _, v := range config.Chains {
				switch v.Name {
				case ethereum:
					testSuite.ExecuteETHFlow(ctx, v, config.CollectorServiceURI)
				case aleo:
					testSuite.ExecuteALEOFlow(ctx, v, config.CollectorServiceURI)
				// case base:
				// 	testSuite.ExecuteETHFlow(ctx, v, config.CollectorServiceURI)
				}

			}
			attestor.StopRelayImage("../compose.yaml")
		}
	}
}
