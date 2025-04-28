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

// MigrateKVStore is the method that triggeres the migration for the specified keys inside []MigrationPair struct
// This method is for the migration of attestor to version 1.1.0
func MigrateKVStore() error {
	migrations := []MigrationPair{
		{
			OldNamespace: "aleo_rpns27234042785",
			NewNamespace: "aleo_rpns_6694886634401_27234042785",
		},
		{
			OldNamespace: "ethereum_rpns6694886634401",
			NewNamespace: "ethereum_rpns_27234042785_6694886634401",
		},
		{
			OldNamespace: "aleo_bsns27234042785",
			NewNamespace: "aleo_bsns_6694886634401_27234042785",
		},
		{
			OldNamespace: "ethereum_bsns6694886634401",
			NewNamespace: "ethereum_bsns_27234042785_6694886634401",
		},
	}
	for _, m := range migrations {
		if err := migrateInternalBoltDb(m.OldNamespace, m.NewNamespace); err != nil {
			logger.GetLogger().Error("Migration failed", zap.Any("oldnamespace", m.OldNamespace), zap.Any("newnamespace", m.NewNamespace))
			return err
		}
	}
	return nil
}

// migrateInternalDatabase copies all key-value pairs from the old namespace to the new namespace
// in the BoltDB store, and deletes the old namespace after the migration is complete.
func migrateInternalBoltDb(oldNamespace, newNamespace string) error {

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
