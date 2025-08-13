package logger

import (
	"fmt"
	"io"
	"os"
	"strings"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
)

// Config holds all the configuration for the logger.
type Config struct {
	// Level is the minimum log level that will be captured.
	// Valid values are "debug", "info", "warn", "error".
	Level string `yaml:"level"`
	// Encoding sets the format for logs.
	// Valid values are "json", "console".
	Encoding string `yaml:"encoding"`
	// OutputPaths is a list of destinations for logs.
	// Can be "stdout", "stderr", or a file path.
	OutputPaths []string `yaml:"outputPaths"`
	// Rotation holds the configuration for log file rotation.
	// It is only used if one of the output paths is a file.
	Rotation *RotationConfig `yaml:"rotation"`
}

// RotationConfig configures log file rotation.
type RotationConfig struct {
	// MaxSize is the maximum size in megabytes of the log file before it gets rotated.
	MaxSize int `yaml:"max_size"`
	// MaxAge is the maximum number of days to retain old log files.
	MaxAge int `yaml:"max_age"`
	// MaxBackups is the maximum number of old log files to retain.
	MaxBackups int `yaml:"max_backups"`
	// Compress determines if the rotated log files should be compressed.
	Compress bool `yaml:"compress"`
}

// New creates a new zap.Logger based on the provided configuration.
func New(cfg Config) (*zap.Logger, error) {
	var level zapcore.Level
	if err := level.Set(cfg.Level); err != nil {
		return nil, fmt.Errorf("invalid log level: %w", err)
	}

	encoder, err := getEncoder(cfg.Encoding)
	if err != nil {
		return nil, err
	}

	writeSyncer, err := getWriteSyncer(cfg.OutputPaths, cfg.Rotation)
	if err != nil {
		return nil, err
	}

	core := zapcore.NewCore(encoder, writeSyncer, level)
	return zap.New(core, zap.AddCaller(), zap.AddStacktrace(zap.ErrorLevel)), nil
}

func getEncoder(encoding string) (zapcore.Encoder, error) {
	config := zap.NewProductionEncoderConfig()
	config.EncodeTime = zapcore.ISO8601TimeEncoder

	switch strings.ToLower(encoding) {
	case "json":
		return zapcore.NewJSONEncoder(config), nil
	case "console":
		return zapcore.NewConsoleEncoder(config), nil
	default:
		return nil, fmt.Errorf("unsupported encoding: %s", encoding)
	}
}

func getWriteSyncer(paths []string, rotation *RotationConfig) (zapcore.WriteSyncer, error) {
	if len(paths) == 0 {
		return nil, fmt.Errorf("at least one output path must be specified")
	}

	writers := make([]io.Writer, 0, len(paths))
	for _, path := range paths {
		switch strings.ToLower(path) {
		case "stdout":
			writers = append(writers, os.Stdout)
		default:
			if rotation == nil {
				return nil, fmt.Errorf("rotation config must be provided for file path: %s", path)
			}
			writers = append(writers, &lumberjack.Logger{
				Filename:   path,
				MaxSize:    rotation.MaxSize,
				MaxBackups: rotation.MaxBackups,
				MaxAge:     rotation.MaxAge,
				Compress:   rotation.Compress,
			})
		}
	}

	return zapcore.AddSync(io.MultiWriter(writers...)), nil
}
