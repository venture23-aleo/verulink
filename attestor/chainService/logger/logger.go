package logger

import (
	"io"
	"os"
	"sync"

	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/config"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
)

var logger *zap.Logger
var once sync.Once

func init() {
	var err error
	logger, err = zap.NewDevelopment()
	if err != nil {
		panic(err)
	}
}

func GetLogger() *zap.Logger {
	return logger
}

func InitLogging(mode string, cfg *config.LoggerConfig) {
	once.Do(func() {
		initLog(mode, cfg)
	})
}

func initLog(mode string, cfg *config.LoggerConfig) {
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
	var mW io.Writer // multi-writer
	if mode == config.Development {
		mW = io.MultiWriter(lumber, os.Stdout)
	} else {
		mW = io.MultiWriter(lumber)
	}

	w := zapcore.AddSync(mW)

	var (
		level  = zap.NewAtomicLevel()
		zapCfg zapcore.EncoderConfig
	)
	if mode == config.Production {
		level.SetLevel(zap.DebugLevel)
		zapCfg = zap.NewProductionEncoderConfig()
	} else {
		level.SetLevel(zap.DebugLevel)
		zapCfg = zap.NewDevelopmentEncoderConfig()
	}

	zapCfg.TimeKey = "ts"
	zapCfg.LevelKey = "level"
	zapCfg.CallerKey = "caller"
	zapCfg.StacktraceKey = "stacktrace"
	zapCfg.MessageKey = "msg"

	enc := zapcore.NewConsoleEncoder(zapCfg)
	if cfg.Encoding == "json" {
		enc = zapcore.NewJSONEncoder(zapCfg)
	}

	core := zapcore.NewCore(
		enc,
		w,
		level,
	)

	if mode == config.Production {
		logger = zap.New(core)
	} else {
		logger = zap.New(core, zap.Development(), zap.AddCaller())
	}
}

func getLogConfig(mode string) struct {
	maxSize   int
	maxBackup int
	maxAge    int
	compress  bool
} {

	if mode == config.Production {
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
