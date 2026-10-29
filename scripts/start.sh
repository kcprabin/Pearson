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

# Quick launch via Docker Compose if requested or chosen
if command_exists docker; then
    DOCKER_CMD="docker"
    if ! docker info &> /dev/null; then
        DOCKER_CMD="sudo docker"
    fi

    echo -e "${BLUE}Tip: You can start all Pearson instances (Postgres, Mongo, Redis, Kafka, FreeLLM, Agent, API, Web) at once using Docker Compose without installing Node, pnpm, uv, or OpenSSL locally.${NC}"
    read -rp "Run all instances together with Docker Compose? [Y/n]: " RUN_DOCKER
    RUN_DOCKER=${RUN_DOCKER:-Y}
    if [[ "$RUN_DOCKER" =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Starting entire Pearson stack with Docker Compose...${NC}"
        $DOCKER_CMD compose up --build
        exit 0
    fi
fi

# Determine docker command prefix (adds sudo if current user lacks socket permission)
get_docker_cmd() {
    if docker info &> /dev/null; then
        echo "docker"
    else
        echo "sudo docker"
    fi
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

DOCKER_CMD=$(get_docker_cmd)

if ! $DOCKER_CMD compose version &> /dev/null && ! command_exists docker-compose; then
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

if [ -d "$FREELLM_DIR" ]; then
    echo -e "${YELLOW}Directory '$FREELLM_DIR' exists. Preparing container...${NC}"
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

echo -e "${YELLOW}Starting FreeLLM API in foreground mode. Copy your activation code from the logs below!${NC}"
echo -e "${YELLOW}Press Ctrl+C once you have saved the code to proceed.${NC}"

# Run container in foreground mode (without -d) to output activation logs
if $DOCKER_CMD compose version &> /dev/null; then
    $DOCKER_CMD compose up
else
    docker-compose up
fi

cd "$PROJECT_ROOT"

echo ""
echo "=== 3. Writing Root Environment (.env) ==="

# Prompt user for their key obtained from the FreeLLM API interface/activation process
read -p "Enter your FreeLLM API Key: " USER_GOOGLE_API_KEY

cat <<EOF > "$PROJECT_ROOT/.env"
PORT=3000
POSTGRES_USER=pearson
POSTGRES_PASSWORD=pearson_dev_password
POSTGRES_DB=pearson
DATABASE_URL=postgresql://pearson:pearson_dev_password@localhost:5432/pearson
MONGO_INITDB_ROOT_USERNAME=prabin
MONGO_INITDB_ROOT_PASSWORD=kcprabin
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092

GOOGLE_API_KEY=$USER_GOOGLE_API_KEY
AGENT_URL=http://localhost:8000
EOF

# Copy .env directly to infra directory so docker-compose commands find it automatically
cp "$PROJECT_ROOT/.env" "$PROJECT_ROOT/infra/.env"

echo -e "${GREEN}.env file successfully written at $PROJECT_ROOT/.env and synced to $PROJECT_ROOT/infra/.env!${NC}"
echo -e "${GREEN}FreeLLM API setup complete.${NC}"

echo "=== 4. Starting Infrastructure Containers ==="

cd "$PROJECT_ROOT/infra"

# Check if a postgres container is already running to prevent 5432 port conflict
if $DOCKER_CMD ps --format '{{.Names}}' | grep -i -q "postgres"; then
    echo -e "${YELLOW}A PostgreSQL container is already running on the system.${NC}"
fi

# Determine docker compose command prefix
if $DOCKER_CMD compose version &> /dev/null; then
    DOCKER_COMPOSE="$DOCKER_CMD compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Start containers in detached mode
$DOCKER_COMPOSE up -d

echo -e "${YELLOW}Verifying container health...${NC}"
sleep 3

# Check for any containers that are NOT in a running state (added || true to prevent set -e exit on empty match)
FAILED_CONTAINERS=$($DOCKER_COMPOSE ps --format "{{.Name}} {{.State}}" | grep -v "running" || true)

if [ -n "$FAILED_CONTAINERS" ]; then
    echo -e "${RED}Error: The following containers failed to start or are not running:${NC}"
    echo "$FAILED_CONTAINERS"
    echo ""
    echo -e "${RED}Container logs:${NC}"
    $DOCKER_COMPOSE logs --tail=20
    cd "$PROJECT_ROOT"
    exit 1
else
    echo -e "${GREEN}All infrastructure containers are up and running cleanly!${NC}"
fi

cd "$PROJECT_ROOT"
echo ""

echo "=== 5. Installing Workspace Dependencies & Building Database Package ==="

echo "Installing workspace dependencies..."
pnpm install

echo "Installing Agent virtual environment..."
cd services/agent && uv sync && cd "$PROJECT_ROOT"

# BUILD DATABASE PACKAGE 
echo -e "${YELLOW}Building Database package (@Pearson/database)...${NC}"
pnpm --filter @Pearson/database build 
cd "$PROJECT_ROOT"/packages/database && pnpm run db:migrate && pnpm run db:generate && cd "$PROJECT_ROOT"
echo -e "${GREEN}Database package built and migrations applied successfully!${NC}"

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

echo "=== 6. Background Service Launch & Log Streaming ==="

mkdir -p apps/api services/agent
rm -f apps/api/api.log services/agent/agent.log
touch apps/api/api.log services/agent/agent.log

# Start API in background via root npm script
nohup bash -c "pnpm run dev:api" > apps/api/api.log 2>&1 &
API_PID=$!

# Start Agent in background via root npm script
nohup bash -c "pnpm run dev:agent" > services/agent/agent.log 2>&1 &
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
echo -e "${YELLOW} The system will remain active until you type 'Kill'${NC}"
echo "================================================================="
echo ""

# Interactive terminal listener loop
while true; do
    read -rp "Type 'Kill' to terminate background services: " INPUT_CMD
    if [ "$INPUT_CMD" == "Kill" ]; then
        echo -e "${YELLOW}Termination command received.${NC}"
        break
    fi
done