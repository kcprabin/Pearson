#!/usr/bin/env bash

set -e

# Ensure script runs relative to the project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "================================================================="
echo " Welcome! I'm your Pearson AI System Setup & Execution Script."
echo " Initializing complete setup, infrastructure, and background jobs!"
echo "================================================================="
echo ""

# Helper function to check if command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Dependency installation routines
install_node() {
    echo -e "${YELLOW}Node.js not found or outdated. Installing Node 24 via fnm...${NC}"
    if command_exists curl; then
        curl -fsSL https://fnm.vercel.app/install | bash
        export PATH="$HOME/.local/share/fnm:$PATH"
        eval "$(fnm env)"
        fnm install 24
        fnm default 24
    elif command_exists brew; then
        brew install fnm
        eval "$(fnm env)"
        fnm install 24
        fnm default 24
    else
        echo -e "${RED}Error: Unable to install Node.js automatically. Please install Node.js >= 24 manually.${NC}"
        exit 1
    fi
}

install_pnpm() {
    echo -e "${YELLOW}pnpm not found. Installing...${NC}"
    if command_exists npm; then
        npm install -g pnpm@11
    elif command_exists brew; then
        brew install pnpm
    else
        curl -fsSL https://get.pnpm.io/install.sh | sh -
        export PATH="$HOME/.local/share/pnpm:$PATH"
    fi
}

install_uv() {
    echo -e "${YELLOW}uv package manager not found. Installing...${NC}"
    if command_exists curl; then
        curl -LsSf https://astral.sh/uv/install.sh | sh
        export PATH="$HOME/.local/bin:$PATH"
    elif command_exists brew; then
        brew install uv
    else
        echo -e "${RED}Error: Unable to install uv automatically. Please install uv manually.${NC}"
        exit 1
    fi
}

install_docker() {
    echo -e "${YELLOW}Docker/Docker Compose not found. Attempting installation...${NC}"
    if command_exists apt-get; then
        sudo apt-get update
        sudo apt-get install -y docker.io docker-compose-plugin
    elif command_exists pacman; then
        sudo pacman -Sy --noconfirm docker docker-compose
    elif command_exists dnf; then
        sudo dnf install -y docker docker-compose-plugin
    elif command_exists brew; then
        brew install --cask docker
    else
        echo -e "${RED}Error: Unable to auto-install Docker. Please install Docker manually and rerun script.${NC}"
        exit 1
    fi

    if command_exists systemctl; then
        sudo systemctl start docker
        sudo systemctl enable docker
    fi
}

echo "=== 1. Checking System Prerequisites ==="

if ! command_exists openssl; then
    echo -e "${RED}Error: OpenSSL is required but not installed. Please install OpenSSL first.${NC}"
    exit 1
fi

if ! command_exists docker; then
    install_docker
fi

if ! docker compose version &> /dev/null && ! command_exists docker-compose; then
    install_docker
fi

if ! command_exists node; then
    install_node
else
    NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_VERSION" -lt 24 ]; then
        install_node
    fi
fi

if ! command_exists pnpm; then
    install_pnpm
fi

if ! command_exists uv; then
    install_uv
fi

echo -e "${GREEN}All system prerequisites verified!${NC}"
echo ""

echo "=== 2. Managing FreeLLM API Container ==="

FREELLM_DIR="$PROJECT_ROOT/scripts/freellmapi"

if docker ps --format '{{.Names}}' | grep -q "freellmapi"; then
    echo -e "${GREEN}FreeLLM API Docker container is already running!${NC}"
else
    if [ -d "$FREELLM_DIR" ]; then
        echo -e "${YELLOW}Directory '$FREELLM_DIR' exists. Starting container...${NC}"
        cd "$FREELLM_DIR"
    else
        echo "Cloning FreeLLM API repository into scripts/freellmapi..."
        mkdir -p "$PROJECT_ROOT/scripts"
        cd "$PROJECT_ROOT/scripts"
        git clone https://github.com/tashfeenahmed/freellmapi.git
        cd "$FREELLM_DIR"
    fi

    if [ ! -f ".env" ]; then
        ENCRYPTION_KEY="$(openssl rand -hex 32)"
        printf "ENCRYPTION_KEY=%s\nPORT=3001\n" "$ENCRYPTION_KEY" > .env
    fi

    if docker compose version &> /dev/null; then
        docker compose up -d
    else
        docker-compose up -d
    fi
    cd "$PROJECT_ROOT"
fi

echo ""
echo "================================================================="
echo -e "${BLUE} FreeLLM API container running at: http://localhost:3001 ${NC}"
echo "================================================================="
echo " Please open http://localhost:3001 in your browser, log in,"
echo " generate your API key, and paste it below."
echo "================================================================="
echo ""

read -rp "Enter your generated API Key: " USER_API_KEY

echo ""
echo "=== 3. First-Time System Boot Configuration ==="
echo -e "${YELLOW}Please enter your restaurant details to complete the setup:${NC}"

read -rp "Enter Restaurant Name: " RESTAURANT_NAME
read -rp "Enter Owner Name: " OWNER_NAME
read -rp "Enter Phone Number: " PHONE_NUMBER

echo ""
echo "=== 4. Writing Target Environment (.env) ==="

cd "$PROJECT_ROOT"
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

RESTAURANT_NAME="${RESTAURANT_NAME}"
OWNER_NAME="${OWNER_NAME}"
PHONE_NUMBER="${PHONE_NUMBER}"
EOF

echo -e "${GREEN}.env file successfully configured at $PROJECT_ROOT/.env!${NC}"
echo ""

echo "=== 5. Starting Infrastructure Containers ==="

cd "$PROJECT_ROOT/infra"
if docker compose version &> /dev/null; then
    docker compose up -d
else
    docker-compose up -d
fi
cd "$PROJECT_ROOT"

echo -e "${GREEN}Infrastructure stack initialized (PostgreSQL, MongoDB, Redis, Kafka)!${NC}"
echo ""

echo "=== 6. Installing Workspace Dependencies & Building Database Package ==="

echo "Installing workspace dependencies..."
pnpm install

echo "Installing Agent virtual environment..."
cd services/agent && uv sync && cd "$PROJECT_ROOT"

# BUILD DATABASE PACKAGE FIRST SO TS CAN RESOLVE @Pearson/database
echo -e "${YELLOW}Building Database package (@Pearson/database)...${NC}"
pnpm --filter @Pearson/database build

echo "Installing API packages..."
cd apps/api && pnpm install && cd "$PROJECT_ROOT"

echo "Installing Web packages..."
cd apps/web && pnpm install && cd "$PROJECT_ROOT"

echo "Building API project..."
cd apps/api && pnpm run build && cd "$PROJECT_ROOT"

echo "Building Web project..."
cd apps/web && pnpm run build && cd "$PROJECT_ROOT"

echo -e "${GREEN}All workspace projects built successfully!${NC}"
echo ""

echo "=== 7. Background Service Launch & Log Streaming ==="

mkdir -p apps/api services/agent
rm -f apps/api/api.log services/agent/agent.log
touch apps/api/api.log services/agent/agent.log

# Start API in background via nohup
nohup bash -c "cd apps/api && pnpm run start:dev" > apps/api/api.log 2>&1 &
API_PID=$!

# Start Agent in background via nohup
nohup bash -c "cd services/agent && uv run fastapi dev src/main.py" > services/agent/agent.log 2>&1 &
AGENT_PID=$!

# Cleanup handler for processes
cleanup() {
    echo -e "\n${YELLOW}Shutting down background services...${NC}"
    if [ -n "$LOG_TAIL_PID" ] && kill -0 "$LOG_TAIL_PID" 2>/dev/null; then
        kill "$LOG_TAIL_PID" 2>/dev/null || true
    fi
    kill "$API_PID" "$AGENT_PID" 2>/dev/null || true
    echo -e "${GREEN}API (PID: $API_PID) and Agent (PID: $AGENT_PID) stopped cleanly.${NC}"
}

# Attach exit signals
trap cleanup EXIT SIGINT SIGTERM

# Continuous background log parser for API output & QR ready strings
(
    tail -f apps/api/api.log | while IFS= read -r line; do
        echo "[API LOG] $line"
        if [[ "$line" =~ "QR ready" ]] || [[ "$line" =~ "QR code" ]]; then
            echo -e "${GREEN}=================================================================${NC}"
            echo -e "${GREEN} [ALERT] QR Code detected in API output! Please check/scan above ${NC}"
            echo -e "${GREEN}=================================================================${NC}"
        fi
    done
) &
LOG_TAIL_PID=$!

echo ""
echo "================================================================="
echo -e "${GREEN} Background Services Running ${NC}"
echo "   - API PID:   $API_PID (Log file: apps/api/api.log)"
echo "   - Agent PID: $AGENT_PID (Log file: services/agent/agent.log)"
echo "================================================================="
echo -e "${YELLOW} The system will remain active until you type 'endme'.${NC}"
echo "================================================================="
echo ""

# Interactive terminal listener loop
while true; do
    read -rp "Type 'endme' to terminate background services: " INPUT_CMD
    if [ "$INPUT_CMD" == "endme" ]; then
        echo -e "${YELLOW}Termination command received.${NC}"
        break
    fi
done

exit 0