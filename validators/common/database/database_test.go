package database

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

type Data struct {
	Field string
}

func TestDatabase(t *testing.T) {
	db, err := NewDatabase("database")
	defer db.CloseDatabase()
	assert.Nil(t, err)
	data := &Data{"golang"}
	err = db.DbPut("bucket", "programming", data)
	assert.Nil(t, err)
	err = db.ViewData("bucket", "programming")
	assert.Nil(t, err)
}
