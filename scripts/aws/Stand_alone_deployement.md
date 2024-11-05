# Attestor Standalone Deployment Guide

This guide explains how to deploy the attestor using Docker published images. The images are available on Docker Hub: [chainservice](https://hub.docker.com/r/verulink/chainservice) and [signingservice](https://hub.docker.com/r/verulink/signingservice).

### Project Structure

Ensure your project directory is structured as follows:

```
project-root/
│
├── chainService/
│   ├── config.yaml         # Configuration file for chainService
│   └── .mtls/              # Contains attestor certificates and keys (requires sudo access)
│       ├── attestor certs and keys
│       ├── server certificate
│
├── signingService/
│   ├── config.yaml         # Configuration file for signingService
│   └── secrets.yaml        # Secret keys for signingService
│
└── compose.yaml            # Docker Compose file 
```

### chainService Configuration Files

The `config.yaml` for chainService contains all the parameters to run the attestor. You can find the configuration file [here](https://github.com/venture23-aleo/verulink/blob/main/attestor/chainService/config.yaml).

The `.mtls` folder stores the certificates required for mTLS connections for the attestor. Make sure to create this folder with `sudo` access, as it contains sensitive files.

### signingService Configuration Files

The `config.yaml` for signingService contains parameters for the signing functionality of the attestor. You can find the configuration file [here](https://github.com/venture23-aleo/verulink/blob/main/attestor/signingService/config.yaml).

The `secrets.yaml` file contains your private keys. Below is the format for the `secrets.yaml` file:

```yaml
chain:
  ethereum:
    private_key: <your_eth_wallet_private_key>
    wallet_address: <your_eth_wallet_address>
  aleo:
    private_key: <your_aleo_wallet_private_key>
    wallet_address: <your_aleo_wallet_address>
```

### Docker Compose File

The `compose.yaml` file defines the services and volumes required to run the attestor setup.

```yaml
x-dbpath: &p # server as value holder for compose file
  /db

x-logpath: &l
  /log

services:
  chainservice:
    depends_on:
      - signingservice
    image: verulink/chainservice:8a428f7
    volumes:
      - type: volume
        source: db-path
        target: *p
      - type: volume
        source: log-path
        target: *l      
      - type: bind
        source: ./chainService/config.yaml
        target: /configs/config.yaml
      - ./chainService/.mtls:/configs/.mtls
    environment:
      DB_PATH: *p
      LOG_PATH: *l
      LOG_ENC: json
      MODE: prod
      CLEAN_START: false
  signingservice:
    image: verulink/signingservice:8a428f7
    volumes:
      - ./signingService/config.yaml:/configs/config.yaml
      - ./signingService/secrets.yaml:/configs/keys.yaml
    ports:
      - 8080:8080
      
volumes:
  db-path:
  log-path:
```

### Deployment Instructions:

1. Navigate to your project root.
2. Run the following command to start the services:
   ```bash
   docker compose up -d
   ```
   This will pull the necessary images from Docker Hub, set up the volumes, and start the services.

3. Verify that both `chainService` and `signingService` are running:
    ```bash
    docker ps
    ```

4. To stop the services:
   ```bash
   docker compose down
   ```

### Troubleshooting:

- **Volume Mount Issues**: Ensure that all local files (like `config.yaml`, `.mtls`, `secrets.yaml`) exist at the specified paths relative to the project root.
- **Port Conflicts**: If port `8080` is already in use, modify the port mapping in the `signingservice` section of the `compose.yaml`.