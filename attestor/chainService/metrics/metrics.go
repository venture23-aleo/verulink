package metrics

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/push"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/config"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/logger"
	"go.uber.org/zap"
)

type PrometheusMetrics struct {
	Registry                     *prometheus.Registry
	InPacketsCounter             *prometheus.CounterVec
	DeliveredPacketsCounter      *prometheus.CounterVec
	HashedAndSignedPacketCounter *prometheus.CounterVec
	AttestorService              *prometheus.GaugeVec
	DBService                    *prometheus.GaugeVec
	SigningService               *prometheus.GaugeVec
	VersionInfo                  *prometheus.GaugeVec
	StartSequenceNo              *prometheus.GaugeVec
	ProcessedSequenceNo          *prometheus.GaugeVec
}

func (m *PrometheusMetrics) StartVersion(attestorName string, version string) {
	m.VersionInfo.WithLabelValues(attestorName, version).Set(1)
}

func (m *PrometheusMetrics) AddInPackets(attestorName string, chain string, destinationChain string) {
	m.InPacketsCounter.WithLabelValues(attestorName, chain, destinationChain).Add(float64(1))
}

func (m *PrometheusMetrics) DeliveredPackets(attestorName string, sourceChain string, destinationChain string) {
	m.DeliveredPacketsCounter.WithLabelValues(attestorName, sourceChain, destinationChain).Add(float64(1))
}

func (m *PrometheusMetrics) HashedAndSignedPacket(attestorName string, sourceChain string, destinationChain string) {
	m.HashedAndSignedPacketCounter.WithLabelValues(attestorName, sourceChain, destinationChain).Add(float64(1))
}

func (m *PrometheusMetrics) SetAttestorHealth(attestorName string, chain string, value float64) {
	m.AttestorService.WithLabelValues(attestorName, chain).Set(value)
}

func (m *PrometheusMetrics) SetDBServiceHeatlh(attestorName string, value float64) {
	m.DBService.WithLabelValues(attestorName).Set(value)
}

func (m *PrometheusMetrics) SetSigningServiceHealth(attestorName string, value float64) {
	m.SigningService.WithLabelValues(attestorName).Set(value)
}

func (m *PrometheusMetrics) StoredSequenceNo(attestorName string, sourceChain string, destinationChain string, sequenceNo float64) {
	m.StartSequenceNo.WithLabelValues(attestorName, sourceChain, destinationChain).Set(sequenceNo)
}

func (m *PrometheusMetrics) UpdateProcessedSequence(attestorName string, sourceChain string, destinationChain string, sequenceNo float64) {
	m.ProcessedSequenceNo.WithLabelValues(attestorName, sourceChain, destinationChain).Set(sequenceNo)
}

func NewPrometheusMetrics() *PrometheusMetrics {
	packetLables := []string{"attestor_name", "source_chain", "destination_chain"}
	outPakcetLables := []string{"attestor_name", "source_chain", "destination_chain"}
	healthLabels := []string{"attestor_name"}
	registry := prometheus.NewRegistry()
	inPacketsCounter := prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "packet_received",
			Help: "Total packet received",
		}, packetLables)

	outPacktesCounter := prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "packet_delivered",
			Help: "Total packet delivered",
		}, outPakcetLables)

	hashedAndSignedPacketCounter := prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "packet_hashed_and_signed",
			Help: "Total packet hash and signed",
		}, outPakcetLables)

	attestorHealth := prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "chainservice_health",
			Help: "Shows the chainservice health",
		}, []string{"attestor_name", "client_name"})

	dbServiceHealth := prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "db_service_health",
			Help: "Shows the connection with db service",
		}, healthLabels)

	signingSeviceHealth := prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "signing_service_health",
			Help: "Shows the connection with signing service",
		}, healthLabels)

	versionInfo := prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "attestor_version_info",
			Help: "Show the version of the attestor",
		}, []string{"attestor_name", "version"})

	processedSeqInfo := prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "processed_sequence_no",
			Help: "Info for processed sequence of attestor",
		}, packetLables)

	startSeqInfo := prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "start_sequence_no",
			Help: "Info for recieved sequence of attestor",
		}, packetLables)

	registry.MustRegister(inPacketsCounter)
	registry.MustRegister(outPacktesCounter)
	registry.MustRegister(attestorHealth)
	registry.MustRegister(dbServiceHealth)
	registry.MustRegister(signingSeviceHealth)
	registry.MustRegister(hashedAndSignedPacketCounter)
	registry.MustRegister(versionInfo)
	registry.MustRegister(startSeqInfo)
	registry.MustRegister(processedSeqInfo)

	return &PrometheusMetrics{
		Registry:                     registry,
		InPacketsCounter:             inPacketsCounter,
		DeliveredPacketsCounter:      outPacktesCounter,
		HashedAndSignedPacketCounter: hashedAndSignedPacketCounter,
		AttestorService:              attestorHealth,
		DBService:                    dbServiceHealth,
		SigningService:               signingSeviceHealth,
		VersionInfo:                  versionInfo,
		StartSequenceNo:              startSeqInfo,
		ProcessedSequenceNo:          processedSeqInfo,
	}
}

func InitMetrics(cfg config.CollecterServiceConfig, mConfig config.MetricsConfig) (*push.Pusher, error) {
	logger.GetLogger().Info("Initilizing metrics")

	caCert, err := os.ReadFile(cfg.CaCertificate)
	if err != nil {
		return nil, err
	}

	caCertPool := x509.NewCertPool()
	caCertPool.AppendCertsFromPEM(caCert)

	attestorCert, err := tls.LoadX509KeyPair(cfg.AttestorCertificate, cfg.AttestorKey)
	if err != nil {
		log.Fatal(err)
	}
	transport := &http.Transport{
		TLSClientConfig: &tls.Config{
			RootCAs:      caCertPool,
			Certificates: []tls.Certificate{attestorCert},
		},
	}

	httpClient := &http.Client{
		Transport: transport,
	}

	host := config.GetConfig().MetricConfig.Host
	job := config.GetConfig().MetricConfig.JobName
	mode := config.GetConfig().Mode

	pusher := push.New(host, job).Grouping("instance", mode).Client(httpClient)

	return pusher, nil
}

func PushMetrics(ctx context.Context, pusher *push.Pusher, pmetrics *PrometheusMetrics) {

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()
	for {

		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			gatherer := prometheus.Gatherers{
				pmetrics.Registry,
			}
			if err := pusher.Gatherer(gatherer).Push(); err != nil {
				logger.GetLogger().Error("Error pushing metrics to Pushgateway:", zap.Error(err))
			} else {
				logger.GetLogger().Info("Metrics pushed successfully.")
			}
			pmetrics = NewPrometheusMetrics()
		}
	}

}
