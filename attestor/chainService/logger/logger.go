package logger

import (
	"sync"

	"github.com/venture23-aleo/attestor/chainService/config"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
)

type logMode int

const (
	Development logMode = iota
	Production
)

var logger *zap.Logger
var once sync.Once

func init() {
	var err error
	logger, err = zap.NewProduction()
	if err != nil {
		panic(err)
	}
}

func GetLogger() *zap.Logger {
	return logger
}

func InitLogging(mode logMode, cfg *config.LoggerConfig) {
	once.Do(func() {
		initLog(mode, cfg)
	})
}

func initLog(mode logMode, cfg *config.LoggerConfig) {
	logCfg := getLogConfig(mode)
	lumber := &lumberjack.Logger{
		Filename:   cfg.OutputPath,
		MaxSize:    logCfg.maxSize,
		MaxBackups: logCfg.maxBackup,
		MaxAge:     logCfg.maxAge,
		Compress:   logCfg.compress,
	}
	err := lumber.Rotate()
	if err != nil {
		panic(err)
	}

	w := zapcore.AddSync(lumber)

	var (
		level  = zap.NewAtomicLevel()
		zapCfg zapcore.EncoderConfig
	)
	if mode == Development {
		level.SetLevel(zap.DPanicLevel)
		zapCfg = zap.NewDevelopmentEncoderConfig()
		zapCfg.TimeKey = "ts"
	} else {
		level.SetLevel(zap.ErrorLevel)
		zapCfg = zap.NewProductionEncoderConfig()
	}

	enc := zapcore.NewConsoleEncoder(zapCfg)
	if cfg.Encoding == "json" {
		enc = zapcore.NewJSONEncoder(zapCfg)
	}

	core := zapcore.NewCore(
		enc,
		w,
		level,
	)

	if mode == Development {
		logger = zap.New(core, zap.Development())
	} else {
		logger = zap.New(core)
	}
}

func getLogConfig(mode logMode) struct {
	maxSize   int
	maxBackup int
	maxAge    int
	compress  bool
} {

	if mode == Development {
		return struct {
			maxSize   int
			maxBackup int
			maxAge    int
			compress  bool
		}{
			maxSize:   10,
			maxBackup: 2,
			maxAge:    2,
			compress:  false,
		}
	}

	return struct {
		maxSize   int
		maxBackup int
		maxAge    int
		compress  bool
	}{
		maxSize:   100,
		maxBackup: 100,
		maxAge:    180,
		compress:  true,
	}
}
