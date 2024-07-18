package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
)

type PrometheusMetrics struct {
	Registry                     *prometheus.Registry
	InPacketsCounter             *prometheus.CounterVec
	DeliveredPacketsCounter      *prometheus.CounterVec
	HashedAndSignedPacketCounter *prometheus.CounterVec
	AttestorService              *prometheus.GaugeVec
	DBService                    *prometheus.GaugeVec
	SigningService               *prometheus.GaugeVec
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

func NewPrometheusMetrics() *PrometheusMetrics {
	packetLables := []string{"attestor_name", "client_name", "destiantion_chain"}
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

	registry.MustRegister(inPacketsCounter)
	registry.MustRegister(outPacktesCounter)
	registry.MustRegister(attestorHealth)
	registry.MustRegister(dbServiceHealth)
	registry.MustRegister(signingSeviceHealth)
	registry.MustRegister(hashedAndSignedPacketCounter)

	return &PrometheusMetrics{
		Registry:                     registry,
		InPacketsCounter:             inPacketsCounter,
		DeliveredPacketsCounter:      outPacktesCounter,
		HashedAndSignedPacketCounter: hashedAndSignedPacketCounter,
		AttestorService:              attestorHealth,
		DBService:                    dbServiceHealth,
		SigningService:               signingSeviceHealth,
	}
}
