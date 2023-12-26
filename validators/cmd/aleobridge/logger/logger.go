package logger

import (
	"sync"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
)

type logMode int

const (
	Development logMode = iota
	Production
)

var Logger *zap.Logger
var once sync.Once

func init() {
	var err error
	Logger, err = zap.NewProduction()
	if err != nil {
		panic(err)
	}
}

func InitLogging(mode logMode, outputPath string) {
	once.Do(func() {
		initLog(mode, outputPath)
	})
}

func initLog(mode logMode, outPath string) {
	lumber := &lumberjack.Logger{
		Filename:   outPath,
		MaxSize:    10,
		MaxBackups: 100,
		MaxAge:     180,
		Compress:   true,
	}
	lumber.Rotate()

	w := zapcore.AddSync(lumber)

	var (
		level = zap.NewAtomicLevel()
		cfg   zapcore.EncoderConfig
	)

	if mode == Development {
		level.SetLevel(zap.DPanicLevel)
		cfg = zap.NewDevelopmentEncoderConfig()
		cfg.TimeKey = "ts"
	} else {
		level.SetLevel(zap.ErrorLevel)
		cfg = zap.NewProductionEncoderConfig()
	}

	core := zapcore.NewCore(
		zapcore.NewJSONEncoder(cfg),
		w,
		level,
	)

	if mode == Development {
		Logger = zap.New(core, zap.Development())
	} else {
		Logger = zap.New(core)
	}
}
