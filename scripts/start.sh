#!/usr/bin/env bash

set -e


echo "================================================================="
echo " Welcome! I'm your AI Dining Agent for Restaurant Ordering."
echo " Let's get your system environment set up and ready to go!"
echo "================================================================="
echo ""

echo "=== 1. Checking Prerequisites ==="

# Check OpenSSL
if ! command -v openssl &> /dev/null; then
    echo "Error: OpenSSL is required but not installed. Please install OpenSSL first."
    exit 1
fi

# Detect Package Manager for Linux
install_docker() {
    echo "Docker/Docker Compose not found. Attempting to install..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y docker.io docker-compose-plugin
    elif command -v pacman &> /dev/null; then
        sudo pacman -Sy --noconfirm docker docker-compose
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y docker docker-compose-plugin
    elif command -v brew &> /dev/null; then
        brew install --cask docker
    else
        echo "Error: Unable to auto-install Docker. Please install Docker manually and rerun this script."
        exit 1
    fi

    # Ensure Docker service is running on Linux systems using systemd
    if command -v systemctl &> /dev/null; then
        sudo systemctl start docker
        sudo systemctl enable docker
    fi
}

# Check Docker CLI
if ! command -v docker &> /dev/null; then
    install_docker
fi

# Check Docker Compose (plugin or standalone)
if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    install_docker
fi

echo "All prerequisites met!"

echo "=== 2. Setting Up Repository ==="

REPO_DIR="freellmapi"

if [ -d "$REPO_DIR" ]; then
    echo "Directory '$REPO_DIR' already exists. Navigating into it..."
    cd "$REPO_DIR"
else
    git clone https://github.com/tashfeenahmed/freellmapi.git
    cd "$REPO_DIR"
fi

echo "=== 3. Configuring FreeLLM API Environment ==="

# Generate encryption key and set initial .env for freellmapi deployment
ENCRYPTION_KEY="$(openssl rand -hex 32)"
printf "ENCRYPTION_KEY=%s\nPORT=3001\n" "$ENCRYPTION_KEY" > .env
echo "Initial environment configured in .env with PORT=3001."

echo "=== 4. Starting Docker Container ==="

# Run docker compose (supports both 'docker compose' and 'docker-compose')
if docker compose version &> /dev/null; then
    docker compose up -d
else
    docker-compose up -d
fi

echo ""
echo "================================================================="
echo " App is now running at: http://localhost:3001"
echo "================================================================="
echo " Please open your browser, visit http://localhost:3001, login,"
echo " generate your API key, and return here."
echo "================================================================="
echo ""

# Prompt the user for the generated API key
read -rp "Enter your generated API Key: " USER_API_KEY

echo "=== 5. Generating Target .env File ==="

# Output the requested configuration format to .env
cat <<EOF > .env
PORT=3000
POSTGRES_USER=prabin
POSTGRES_PASSWORD=kcprabin
POSTGRES_DB=pearson
DATABASE_URL=postgresql://prabin:kcprabin@localhost:5432/pearson
MONGO_INITDB_ROOT_USERNAME=prabin
MONGO_INITDB_ROOT_PASSWORD=kcprabin
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092

GOOGLE_API_KEY=${USER_API_KEY}
AGENT_URL=http://localhost:8000
EOF

echo ""
echo ".env file successfully generated with your GOOGLE_API_KEY!"
echo "Setup complete. Your AI Dining Agent environment is ready to use!"