package store

import (
	"encoding/json"

	"github.com/venture23-aleo/verulink/attestor/chainService/chain"
	"github.com/venture23-aleo/verulink/attestor/chainService/logger"
	"go.uber.org/zap"
)

type MigrationPair struct {
	OldNamespace string
	NewNamespace string
}

// MigrateInternalDatabase copies all key-value pairs from the old namespace to the new namespace
// in the BoltDB store, and deletes the old namespace after the migration is complete.
func MigrateInternalDatabase(oldNamespace, newNamespace string) error {

	if !namespaceExists(oldNamespace) {
		logger.GetLogger().Info("Old namespace does not exist. Skipping migration.",
			zap.String("oldNamespace", oldNamespace),
		)
		return nil
	}

	logger.GetLogger().Info("Starting migration",
		zap.String("oldNamespace", oldNamespace),
		zap.String("newNamespace", newNamespace),
	)

	if err := CreateNamespace(newNamespace); err != nil {
		logger.GetLogger().Error("Failed to create new namespace", zap.Error(err))
		return err
	}

	ch := retrieveNKeyValuesFromFirst(oldNamespace, 10000)

	for kv := range ch {
		key := kv[0]
		value := kv[1]

		if ExistInGivenNamespace(newNamespace, key) {
			logger.GetLogger().Debug("Skipping already migrated key", zap.ByteString("key", key))
			continue
		}

		var pkt chain.Packet
		isPacket := false
		if len(value) > 0 && json.Unmarshal(value, &pkt) == nil {
			isPacket = true
		}

		if err := put(newNamespace, key, value); err != nil {
			logger.GetLogger().Error("Failed to put in new namespace", zap.ByteString("key", key), zap.Error(err))
			continue
		}

		if isPacket {
			logger.GetLogger().Debug("Migrated packet", zap.Uint64("seq", pkt.Sequence))
		} else {
			logger.GetLogger().Debug("Migrated seq/height ", zap.ByteString("key", key))
		}
	}

	// delete the namespace itself
	if err := DeleteNamespace(oldNamespace); err != nil {
		logger.GetLogger().Error("Could not delete oldnamespace ", zap.Error(err))
		return err
	}

	logger.GetLogger().Info("Migration completed",
		zap.String("oldNamespace", oldNamespace),
		zap.String("newNamespace", newNamespace),
	)

	return nil
}
