package config

import (
	"os"

	"gopkg.in/yaml.v3"
)

type AuthCredentials struct {
	Creds Creds `yaml:"cred"`
}
type Creds struct {
	Username string `yaml:"username"`
	Password string `yaml:"password"`
}

var authCredentials *AuthCredentials 

func GetCredentials() *Creds {
	return &authCredentials.Creds
}

func InitKeys(flagArgs *FlagArgs) error {
	s, err := os.ReadFile(flagArgs.AuthSecretsFile)
	if err != nil {
		return err
	}
	authCredentials = new(AuthCredentials)

	err = yaml.Unmarshal(s, authCredentials)
	if err != nil {
		return err
	}
	return nil
}
