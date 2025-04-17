#!/bin/bash

set -e


# === Resolve Script Directory ===
export SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export BASE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
export CHAIN_DIR="$BASE_DIR/attestor/chainService"
export SIGN_DIR="$BASE_DIR/attestor/signingService"



# === ARGUMENT PARSING ===
for arg in "$@"; do
  case $arg in
    --chain-config=*)
      CHAIN_CONFIG="${arg#*=}"
      shift
      ;;
    --sign-config=*)
      SIGN_CONFIG="${arg#*=}"
      shift
      ;;
    --secrets=*)
      SECRETS_FILE="${arg#*=}"
      shift
      ;;
    --ca_cert=*)
      CA_CERT="${arg#*=}"
      shift
      ;;
    --attestor_cert=*)
      ATTESTOR_CERT="${arg#*=}"
      shift
      ;;
    --attestor_key=*)
      ATTESTOR_KEY="${arg#*=}"
      shift
      ;;
    *)
      echo "❌ Unknown argument: $arg"
      exit 1
      ;;
  esac
done

# === VALIDATION ===
MISSING_ARGS=0

if [[ -z "$CHAIN_CONFIG" || ! -f "$CHAIN_CONFIG" ]]; then
  echo "❌ Chain config file is missing or not found: $CHAIN_CONFIG"
  MISSING_ARGS=1
fi

if [[ -z "$SIGN_CONFIG" || ! -f "$SIGN_CONFIG" ]]; then
  echo "❌ Signing config file is missing or not found: $SIGN_CONFIG"
  MISSING_ARGS=1
fi

if [[ -z "$SECRETS_FILE" || ! -f "$SECRETS_FILE" ]]; then
  echo "❌ Secrets file is missing or not found: $KEYS_FILE"
  MISSING_ARGS=1
fi

if [[ -z "$CA_CERT" || ! -f "$CA_CERT" ]]; then
  echo "❌ CA certificate file is missing or not found: $CA_CERT"
  MISSING_ARGS=1
fi

if [[ -z "$ATTESTOR_CERT" || ! -f "$ATTESTOR_CERT" ]]; then
  echo "❌ Attestor certificate file is missing or not found: $ATTESTOR_CERT"
  MISSING_ARGS=1
fi

if [[ -z "$ATTESTOR_KEY" || ! -f "$ATTESTOR_KEY" ]]; then
  echo "❌ Attestor key file is missing or not found: $ATTESTOR_KEY"
  MISSING_ARGS=1
fi

if [[ "$MISSING_ARGS" -eq 1 ]]; then
  echo ""
  echo "📌 Usage:"
  echo "  $0 --chain-config=/path/to/chainservice.yaml --sign-config=/path/to/signingservice.yaml --secrets=/path/to/secret.yaml --ca_cert=/path/to/ca.cert --attestor_cert=/path/to/attestor.cert --attestor_key=/path/to/attestor.key"
  exit 1
fi


echo ""
echo "🔍 Please review and confirm your configuration files:"
echo " - Chain config      : $CHAIN_CONFIG"
echo " - Signing config    : $SIGN_CONFIG"
echo " - Secrets file      : $SECRETS_FILE"
echo " - CA Certificate    : $CA_CERT"
echo " - Attestor Cert     : $ATTESTOR_CERT"
echo " - Attestor Key      : $ATTESTOR_KEY"
read -p "Press ENTER to continue, or Ctrl+C to cancel..."

# === INSTALLATION DIRECTORY PROMPT ===
echo ""
read -p "📦 Enter installation directory [default: /opt/attestor]: " INSTALL_DIR
export INSTALL_DIR="${INSTALL_DIR:-/opt/attestor}"

echo "📁 Installation path set to: $INSTALL_DIR"

# === SETUP PATHS ===
export BIN_DIR="$INSTALL_DIR/bin"
export CONFIG_DIR="$INSTALL_DIR/configs"
export DB_DIR="$INSTALL_DIR/db"
export LOG_DIR="/var/log/attestor"
export MTLSKEYS_DIR="$CONFIG_DIR/.mtls"

echo "📁 Creating installation directories..."
sudo mkdir -p "$INSTALL_DIR" "$BIN_DIR" "$CONFIG_DIR" "$LOG_DIR" "$MTLSKEYS_DIR" "$DB_DIR"
sudo chown -R "$(whoami)":"$(whoami)" "$INSTALL_DIR" "$LOG_DIR"

# === CHECK DEPENDENCIES ===
echo "🔍 Checking for required dependencies..."

# Check for Go installation
if ! command -v go &> /dev/null; then
  echo "❌ Go is not installed. Please install Go from https://golang.org/doc/install."
  exit 1
fi

# Check for Rust installation
if ! command -v rustc &> /dev/null; then
  echo "❌ Rust is not installed. Please install Rust from https://www.rust-lang.org/tools/install."
  exit 1
fi

echo "✅ Go and Rust are installed, proceeding with the build."


# === SIGNING SERVICE BIND ADDRESS ===
echo ""
read -p "🔧 Enter Signing Service IP or Hostname (default: 0.0.0.0): " SIGN_IP
read -p "🔧 Enter Signing Service Port [default: 8080]: " SIGN_PORT
SIGN_IP="${SIGN_IP:-0.0.0.0}"
SIGN_PORT="${SIGN_PORT:-8080}"


echo "🔗 Signing Service will bind to: $SIGN_BIND_ADDR"


# === BUILD chainservice ===
(
    echo "🔨 Building chainservice..."
cd "$CHAIN_DIR" || exit 1
go mod tidy
CGO_ENABLED=0 go build -o chainservice
cp chainservice "$BIN_DIR/"
)


# === BUILD signingservice ===
(
echo "🔨 Building signingservice..."
cd "$SIGN_DIR" || exit 1
go mod tidy
CGO_ENABLED=0 go build -o signingservice
cp signingservice "$BIN_DIR/"
)

# === BUILD Rust ahs ===
(
echo "⚙️ Building ahs..."
cd "$SIGN_DIR"/rust || exit 1
cargo build --release
cp target/release/ahs "$BIN_DIR/"
)


# === COPY CONFIGS ===
echo "📋 Copying configs..."
cp "$CHAIN_CONFIG" "$CONFIG_DIR/chainservice.yaml"
cp "$SIGN_CONFIG" "$CONFIG_DIR/signingservice.yaml"
cp "$SECRETS_FILE" "$CONFIG_DIR/secrets.yaml"
cp "$CA_CERT" "$ATTESTOR_CERT" "$ATTESTOR_KEY" -t "$MTLSKEYS_DIR"

# === MODIFY CONFIGS ===
echo "🔧 Updating config files..."

CHAIN_CONFIG_PATH="$CONFIG_DIR/chainservice.yaml"
SIGN_CONFIG_PATH="$CONFIG_DIR/signingservice.yaml"

# Generate machine-specific username/password (based on hostname hash + random)
MACHINE_CODE=$(hostname | sha256sum | head -c 6)
RAND_SUFFIX=$(od -An -N2 -i /dev/urandom | tr -d ' ')
USERNAME="user_$MACHINE_CODE$RAND_SUFFIX"
PASSWORD="pass_$MACHINE_CODE$RAND_SUFFIX"

# Update db_dir and log_dir
sed -i "s|db_dir:.*|db_dir: $DB_DIR|" "$CHAIN_CONFIG_PATH"
sed -i "s|output_dir:.*|output_dir: $LOG_DIR|" "$CHAIN_CONFIG_PATH"

# Update username and password in Chainservice config
sed -i "s|^\s*username:.*|  username: \"$USERNAME\"|" "$CHAIN_CONFIG_PATH"
sed -i "s|^\s*password:.*|  password: \"$PASSWORD\"|" "$CHAIN_CONFIG_PATH"

# Update username and password in Signingservice config
sed -i "s|username:.*|username: $USERNAME|" "$SIGN_CONFIG_PATH"
sed -i "s|password:.*|password: $PASSWORD|" "$SIGN_CONFIG_PATH"

# Replace certificate paths
CA_FILENAME=$(basename "$CA_CERT")
CERT_FILENAME=$(basename "$ATTESTOR_CERT")
KEY_FILENAME=$(basename "$ATTESTOR_KEY")

sed -i "s|^\s*ca_certificate:.*|  ca_certificate: $MTLSKEYS_DIR/$CA_FILENAME|" "$CHAIN_CONFIG_PATH"
sed -i "s|^\s*attestor_certificate:.*|  attestor_certificate: $MTLSKEYS_DIR/$CERT_FILENAME|" "$CHAIN_CONFIG_PATH"
sed -i "s|^\s*attestor_key:.*|  attestor_key: $MTLSKEYS_DIR/$KEY_FILENAME|" "$CHAIN_CONFIG_PATH"

# Update Signing service host and port in Chainservice config
sed -i "s|^\(  host:\s*\).*|\1$SIGN_IP|" "$SIGN_CONFIG_PATH"
sed -i "s|^\(  port:\s*\).*|\1$SIGN_PORT|" "$SIGN_CONFIG_PATH"

echo "✅ config files updated with dynamic values."


chmod 600 "$CONFIG_DIR/secrets.yaml"


# === SYSTEMD UNIT FILES ===
echo "📝 Creating systemd unit files..."

echo ""
echo "📦 Where do you want to install systemd units?"
echo "1) System-wide (requires sudo)"
echo "2) User-level (no sudo)"
read -rp "Select [1/2, default 2]: " systemd_choice
systemd_choice=${systemd_choice:-2}

if [[ "$systemd_choice" == "1" ]]; then
  if [[ "$EUID" -ne 0 ]]; then
    echo "❌ System-wide installation requires root privileges. Please run the script with sudo:"
    echo "   sudo $0 $@"
    exit 1
  fi
  SYSTEMD_DIR="/etc/systemd/system"
  SYSTEMD_MODE="system"
else
  SYSTEMD_DIR="$HOME/.config/systemd/user"
  mkdir -p "$SYSTEMD_DIR"
  SYSTEMD_MODE="user"
fi

# Chainservice

cat <<EOF > "$SYSTEMD_DIR/attestor-chain.service"
[Unit]
Description=Attestor Chain Service
After=network.target

[Service]
ExecStart=$BIN_DIR/chainservice --config=$CONFIG_DIR/chainservice.yaml \\
    --db-dir=$DB_DIR \\
    --log-dir=$LOG_DIR \\
    --log-enc=json \\
    --mode=prod \\
    --clean=false
WorkingDirectory=$INSTALL_DIR
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Signing service
cat <<EOF > "$SYSTEMD_DIR/attestor-sign.service"
[Unit]
Description=Attestor Signing Service
After=network.target

[Service]
ExecStart=$BIN_DIR/signingservice --config=$CONFIG_DIR/signingservice.yaml \\
    --kp=$CONFIG_DIR/secrets.yaml \\
    --address=$SIGN_IP \\
    --port=$SIGN_PORT
WorkingDirectory=$INSTALL_DIR
Environment=PATH=$BIN_DIR:/usr/bin:/bin
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# === START SERVICES ===
echo "🔁 Reloading and starting systemd units..."
if [[ "$SYSTEMD_MODE" == "system" ]]; then
  systemctl daemon-reload
  systemctl enable attestor-chain.service
  systemctl enable attestor-sign.service
  systemctl start attestor-chain.service
  systemctl start attestor-sign.service
else
  systemctl --user daemon-reload
  systemctl --user enable attestor-chain.service
  systemctl --user enable attestor-sign.service
  systemctl --user start attestor-chain.service
  systemctl --user start attestor-sign.service
fi

echo "✅ Deployment complete. Services are running!"