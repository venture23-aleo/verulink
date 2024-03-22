package main

import (
	"context"
	"flag"
	"fmt"
	"os/exec"
	"strconv"
	"strings"
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
	
	cmdAleo := exec.Command("../proxy/proxy", "--remoteUrl", aleoUrls[0], "--port", "3000", "--benchMark", strconv.FormatBool(benchMarkRelayer), "&!")
	err = cmdAleo.Start()
	if err != nil {
		panic(err)
	}
	cmdEthereum := exec.Command("../proxy/proxy", "--remoteUrl", ethEndpoint, "--port", "3001", "&!")
	err = cmdEthereum.Start()
	if err != nil {
		panic(err)
	}

	time.Sleep(time.Second * 5)

	fmt.Println(benchMarkRelayer)

	attestor.WriteE2EConifg(config.WriteConfigPath, ethEndpoint, aleoEndpoint, 5475443, 17, benchMarkRelayer)

	if benchMarkRelayer {
		signingServiceCmd := exec.CommandContext(context.Background(), "../signingService/signingService", "--config", "../signingService/config.yaml", "--kp", "../signingService/keys.yaml", "--port", "8080","&!")
		err := signingServiceCmd.Start()
		if err != nil {
			panic(err)
		}
		fmt.Println("now starting chain service")
		time.Sleep(time.Second * 5)
		chainServiceCmd := exec.CommandContext(context.Background(), "../chainService/chainService", "--config", "../chainService/config.yaml", "&!")
		err = chainServiceCmd.Start()
		if err != nil {
			panic(err)
		}
		fmt.Println("chain service started")
		
		<-ctx.Done()
	} else {
		for i := 0; i < testCycle; i++ {
			attestor.RunRelayImage("../compose.yaml")
			for _, v := range config.Chains {
				switch v.Name {
				case ethereum:
					testSuite.ExecuteETHFlow(ctx, v, config.CollectorServiceURI)
				case aleo:
					testSuite.ExecuteALEOFlow(ctx, v, config.CollectorServiceURI)
				}
			}
			attestor.StopRelayImage("../compose.yaml")
		}
	}
}
