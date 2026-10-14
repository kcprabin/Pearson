# PEARSON 

## Autonomous AI Voice Ordering System for Restaurants

PEARSON is an open-source, headless AI ordering platform for restaurants. It is designed to operate without a traditional restaurant dashboard: owners connect their WhatsApp accounts, manage orders through WhatsApp, and let the AI engine handle voice conversations and menu-driven ordering.

The repository is a Turborepo-style monorepo containing the NestJS API, a Python AI agent, shared database schemas, and local infrastructure services.

## Architecture

```text
Customer phone call
	|
	v
Python AI agent (FastAPI + LangGraph)
	|
	| order event
	v
Apache Kafka
	|
	v
NestJS API
	|
	+--> PostgreSQL / Drizzle ORM
	+--> WhatsApp gateway (Baileys)
	|
	v
Restaurant owner's WhatsApp
```

### Main components

- **NestJS API**: application gateway, restaurant and order services, WhatsApp session management, and Kafka integration.
- **Python agent**: FastAPI service with LangGraph-based orchestration, prompts, tools, and retrieval support.
- **WhatsApp gateway**: Baileys maintains separate `receiver` and `bot` sessions.
- **Kafka**: transports readiness and application events between services.
- **PostgreSQL**: stores restaurant, order, and feedback data through the shared Drizzle schema.
- **MongoDB and Redis**: available in the local infrastructure stack for supporting services.

## How it works

PEARSON runs as background services. The owner uses WhatsApp instead of a restaurant dashboard.

1. **Start the system**: Docker runs PostgreSQL, Kafka, MongoDB, and Redis. The NestJS API and Python AI agent run alongside them.
2. **Link WhatsApp**: The API starts the `receiver` session first. After it connects, the API starts the `bot` session. A QR code is printed for every unregistered session.
3. **Become ready**: When both WhatsApp sessions are connected, the API publishes one `ai-login-procedure` event to Kafka. The event payload is `Ready to go live` with a timestamp.
4. **Load the menu**: The owner sends menu information to the bot. The AI service processes the menu and makes it available to its ordering tools.
5. **Take an order**: A customer calls the restaurant. The AI voice service answers menu questions, confirms items, calculates the order, and creates an order event.
6. **Notify the owner**: The backend stores the order and publishes the event through Kafka. The owner receives the order in WhatsApp and can accept or reject it.
7. **Update the customer**: The backend sends order status updates through WhatsApp as the order progresses.

The readiness event is sent only after both WhatsApp accounts are open. If either account disconnects, the system waits for both sessions to reconnect before publishing readiness again.

## Repository structure

```text
Pearson/
├── apps/
│   ├── api/                         # NestJS backend
│   │   └── src/
│   │       ├── bailey/              # WhatsApp sessions, QR, and messaging
│   │       ├── database/             # API database module
│   │       ├── hotel/                # Restaurant, order, and feedback services
│   │       ├── kafka/                # Kafka producer service
│   │       └── app.module.ts
│   └── web/                         # Web application workspace
├── packages/
│   ├── database/                    # Shared Drizzle schemas and DB client
│   ├── eslint-config/               # Shared lint configuration
│   └── typescript-config/           # Shared TypeScript configuration
├── services/
│   └── agent/                       # Python AI service
│       └── src/
│           ├── agent/               # Agent runtime
│           ├── config/              # Agent configuration
│           ├── graph/               # LangGraph orchestration
│           ├── kafka/               # Agent Kafka integration
│           ├── nodes/               # Graph nodes
│           ├── prompt/              # System prompts
│           ├── rag/                 # Retrieval and menu processing
│           ├── state/               # Agent state
│           ├── tools/               # Agent tools
│           └── main.py              # FastAPI entry point
├── infra/
│   ├── docker-compose.yml           # PostgreSQL, Kafka, MongoDB, and Redis
│   └── docker/                      # Infrastructure Dockerfiles
├── .env-example                    # Local environment template
├── package.json                    # Workspace scripts
└── pnpm-workspace.yaml
```

## Technology stack

- **Backend**: NestJS, TypeScript, Node.js, Baileys, Drizzle ORM
- **AI**: Python, FastAPI, LangChain/LangGraph-compatible agent structure
- **Storage**: PostgreSQL, MongoDB, Redis
- **Events**: Apache Kafka in KRaft mode, KafkaJS
- **Infrastructure**: Docker and Docker Compose
- **Workspace**: pnpm and Turborepo

## Requirements

- Node.js 24 or newer
- pnpm 11
- Python 3.11 or newer for the agent service
- Docker and Docker Compose
- A WhatsApp account for linking the receiver and bot sessions

## Local setup

### 1. Configure environment variables

```bash
cp .env-example .env
```

Review the values in `.env`, especially `DATABASE_URL`, `KAFKA_BROKERS`, and any AI provider credentials required by the agent.

### 2. Start infrastructure

```bash
docker compose -f infra/docker-compose.yml up -d
```

The Compose stack exposes these local services:

| Service    | Address           |
| ---------- | ----------------- |
| PostgreSQL | `localhost:5432`  |
| Kafka      | `localhost:9092`  |
| MongoDB    | `localhost:27017` |
| Redis      | `localhost:6379`  |

### 3. Install JavaScript dependencies

```bash
pnpm install
```

### 4. Build the shared database package

```bash
pnpm --filter @Pearson/database build
```

### 5. Start the API

```bash
pnpm dev:api
```

The API runs on the port configured by `PORT`, which defaults to `3000`.

### 6. Start the AI agent

Install the Python dependencies from `services/agent/requirements.txt`, then run the FastAPI service using the project environment. The exact agent command may vary with the configured Python toolchain; the workspace command is:

```bash
pnpm dev:agent
```

## WhatsApp QR linking

PEARSON uses two WhatsApp roles:

- `receiver`: the first session initialized by the API.
- `bot`: initialized after the receiver session connects.

For an unregistered session, Baileys prints a scannable QR code in the API terminal. The QR is also stored temporarily in memory and is available through the API:

```bash
curl "http://localhost:3000/whatsapp/qr?role=receiver"
curl "http://localhost:3000/whatsapp/qr?role=bot"
```

Open the returned `qr` value in a QR-capable client or scan the terminal QR from WhatsApp's linked-device flow. Once a session is connected, its QR is removed from memory. Authentication files are stored under:

```text
apps/api/auth_info_baileys_receiver/
apps/api/auth_info_baileys_bot/
```

Check connection state with:

```bash
curl "http://localhost:3000/whatsapp/status"
```

When both roles are open, Kafka receives the `ai-login-procedure` readiness event.

## API examples

Send a text message through the bot session:

```bash
curl -X POST "http://localhost:3000/whatsapp/send" \
  -H "Content-Type: application/json" \
  -d '{"phone":"15551234567","message":"Hello from PEARSON"}'
```

## Development commands

```bash
pnpm dev:api       # Start the NestJS API in watch mode
pnpm dev:agent     # Start the Python agent
pnpm build         # Build workspace packages and applications
pnpm check-types   # Run workspace type checks
pnpm lint          # Run workspace linting
```

API-specific commands:

```bash
pnpm --filter api test
pnpm --filter api build
pnpm --filter api lint
```

## Kafka troubleshooting

Check the container logs first:

```bash
docker compose -f infra/docker-compose.yml logs kafka
```

If a local KRaft log directory is preventing startup, stop the stack and recreate it:

```bash
docker compose -f infra/docker-compose.yml down
sudo rm -rf /tmp/kraft-combined-logs
docker compose -f infra/docker-compose.yml up -d --force-recreate
```

## Project status

PEARSON is under active development. The repository currently contains the core API, WhatsApp session and QR flow, Kafka producer integration, shared database schema, and Python agent workspace. Menu ingestion, voice telephony, order event consumers, and production deployment workflows still require additional implementation and configuration.

## Planned one-command installation

The project will provide an `install.sh` script for local servers and VPS deployments. It is planned, but it is not included in the repository yet. Until it is added, use the [Local setup](#local-setup) commands above.

The intended command will be:

```bash
chmod +x install.sh
./install.sh
```

The script will automate the following steps:

- Check that Docker, Docker Compose, Node.js, pnpm, and Python are installed.
- Create `.env` from `.env-example` and collect required secrets and service settings.
- Install JavaScript and Python dependencies.
- Start PostgreSQL, Kafka, MongoDB, and Redis with Docker Compose.
- Build the shared database package and prepare database migrations.
- Start the NestJS API and Python AI agent.
- Display the receiver and bot WhatsApp QR codes and explain when each phone should be scanned.
- Verify the API, database, Kafka, and AI service health before reporting that PEARSON is ready.
