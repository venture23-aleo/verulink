#!/bin/bash

set -e


# === SETUP PATHS ===
export INSTALL_DIR="/opt/attestor"
export BIN_DIR="$INSTALL_DIR/bin"
export CONFIG_DIR="$INSTALL_DIR/config"
export LOG_DIR="/var/log/attestor"

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
    --keys=*)
      KEYS_FILE="${arg#*=}"
      shift
      ;;
    *)
      echo "❌ Unknown argument: $arg"
      exit 1
      ;;
  esac
done

# === VALIDATION ===
if [[ -z "$CHAIN_CONFIG" || -z "$SIGN_CONFIG" || -z "$KEYS_FILE" ]]; then
  echo "Usage: $0 --chain-config=/path/to/chainservice.yaml --sign-config=/path/to/signingservice.yaml --keys=/path/to/secret.yaml"
  exit 1
fi

if [[ ! -f "$CHAIN_CONFIG" ]]; then
  echo "❌ Chain config file not found: $CHAIN_CONFIG"
  exit 1
fi

if [[ ! -f "$SIGN_CONFIG" ]]; then
  echo "❌ Signing config file not found: $SIGN_CONFIG"
  exit 1
fi

if [[ ! -f "$KEYS_FILE" ]]; then
  echo "❌ Keys file not found: $KEYS_FILE"
  exit 1
fi

echo "🔍 Please review and update your config files:"
echo " - Chain config: $CHAIN_CONFIG"
echo " - Signing config: $SIGN_CONFIG"
echo " - Keys file: $KEYS_FILE"
read -p "Press ENTER to continue, or Ctrl+C to cancel..."

# === INSTALLATION DIRECTORY PROMPT ===
echo ""
read -p "📦 Enter installation directory [default: /opt/attestor]: " INSTALL_DIR
export INSTALL_DIR="${INSTALL_DIR:-/opt/attestor}"

echo "📁 Installation path set to: $INSTALL_DIR"


echo "📁 Creating installation directories..."
sudo mkdir -p "$BIN_DIR" "$CONFIG_DIR" "$LOG_DIR"
sudo chown -R "$(whoami)" "$INSTALL_DIR" "$LOG_DIR"

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
cp "$KEYS_FILE" "$CONFIG_DIR/keys.yaml"
chmod 600 "$CONFIG_DIR/keys.yaml"

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
    --db-dir=$INSTALL_DIR/db \\
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
    --kp=$CONFIG_DIR/keys.yaml \\
    --port=8082
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