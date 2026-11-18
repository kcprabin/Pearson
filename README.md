<div align="center">

# PEARSON

### Autonomous AI voice ordering for restaurants

Restaurant ordering through WhatsApp, powered by a NestJS API, a Python AI agent, and event-driven services.

![Node.js](https://img.shields.io/badge/Node.js-24%2B-339933?logo=nodedotjs&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-11-F69220?logo=pnpm&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-API-E0234E?logo=nestjs&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Agent-009688?logo=fastapi&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

</div>

## Overview

PEARSON is an open-source ordering platform for restaurants. It connects WhatsApp through Baileys, uses a Python agent for autonomous ordering conversations, and coordinates the API and agent with Apache Kafka.

The repository includes:

- A NestJS API gateway with WhatsApp integration, restaurant onboarding, and Kafka producers.
- A React and Vite web application.
- A Python FastAPI agent using LangGraph, RAG, and Google or OpenAI-compatible model integrations.
- A Drizzle ORM database package for PostgreSQL.
- A Docker Compose stack containing the application and supporting services.

## Architecture

```mermaid
flowchart LR
    C([Customer on WhatsApp]) <--> W[Baileys sessions]
    W <--> A[NestJS API :3000]
    A <--> K{{Kafka :9092}}
    K <--> G[FastAPI agent :8000]
    G --> L[FreeLLM proxy :3001]
    A --> P[(PostgreSQL :5432)]
    A --> R[(Redis :6379)]
    A --> M[(MongoDB :27017)]
    U[React web :5173] --> A
```

## Prerequisites

- Docker Engine with Docker Compose v2
- Node.js 24 or newer
- pnpm 11
- Python 3.11 or newer
- `uv` for local agent development
- Git

Docker is the recommended way to run the complete system. The Compose file builds the API, agent, and web images and starts the required infrastructure.

## Quick start with Docker

Clone the repository and run the setup script:

```bash
git clone https://github.com/kcprabin/Pearson.git
cd Pearson
chmod +x scripts/start.sh
./scripts/start.sh
```

The script:

1. Checks Docker and Docker Compose.
2. Builds and starts the complete Compose stack.
3. Waits for PostgreSQL, Redis, MongoDB, and Kafka health checks.
4. Shows the FreeLLM container logs and asks for `GOOGLE_API_KEY` when needed.
5. Waits for WhatsApp pairing.
6. Onboards the restaurant through `/hotel/first-login`.
7. Streams application logs until `Ctrl+C`.

Use `./scripts/start.sh --build` to force a fresh application image build.

### Service URLs

| Service         | Address               |
| :-------------- | :-------------------- |
| Web application | http://localhost:5173 |
| NestJS API      | http://localhost:3000 |
| FastAPI agent   | http://localhost:8000 |
| FreeLLM proxy   | http://localhost:3001 |
| PostgreSQL      | localhost:5432        |
| Kafka           | localhost:9092        |
| Redis           | localhost:6379        |
| MongoDB         | localhost:27017       |

## Environment variables

The startup script creates `.env` if it does not exist. Keep this file out of version control.

```dotenv
PORT=3000
POSTGRES_USER=pearson
POSTGRES_PASSWORD=pearson_dev_password
POSTGRES_DB=pearson
DATABASE_URL=postgresql://pearson:pearson_dev_password@localhost:5432/pearson
MONGO_INITDB_ROOT_USERNAME=pearson
MONGO_INITDB_ROOT_PASSWORD=pearson_mongo_dev_password
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092
AGENT_URL=http://localhost:8000
GOOGLE_API_KEY=your_google_api_key
PINECONE_API_KEY=your_pinecone_api_key
```

Container-to-container values are supplied by `docker-compose.yml`; for example, the API uses `kafka:29092` and the agent uses `http://freellmapi:3001/v1` inside the Compose network.

## WhatsApp setup

The API starts separate `receiver` and `bot` Baileys sessions. Authentication data is stored in Docker volumes so it survives container restarts.

Check session status:

```bash
curl http://localhost:3000/whatsapp/status
```

Get a QR code response:

```bash
curl "http://localhost:3000/whatsapp/qr?role=receiver"
curl "http://localhost:3000/whatsapp/qr?role=bot"
```

Pair a phone using a WhatsApp linked-device code:

```bash
curl -X POST http://localhost:3000/whatsapp/pair \
  -H 'Content-Type: application/json' \
  -d '{"phone":"15551234567"}'
```

Send a WhatsApp message:

```bash
curl -X POST http://localhost:3000/whatsapp/send \
  -H 'Content-Type: application/json' \
  -d '{"phone":"15551234567","message":"Hello from PEARSON"}'
```

## API onboarding endpoints

The startup script asks for restaurant details after WhatsApp is paired. The same flow is available through the API:

```bash
curl -X POST http://localhost:3000/hotel/checkuser \
  -H 'Content-Type: application/json' \
  -d '{"phoneNumber":"15551234567"}'
```

```bash
curl -X POST http://localhost:3000/hotel/first-login \
  -H 'Content-Type: application/json' \
  -d '{
    "restaurantName":"Example Restaurant",
    "ownerName":"Restaurant Owner",
    "phoneNumber":"15551234567"
  }'
```

Other hotel routes include password generation and restaurant updates at `/hotel/generatepassword` and `/hotel/update-restro/:thread_id`.

## Local development

Install workspace dependencies:

```bash
pnpm install
```

Start infrastructure only:

```bash
docker compose up -d postgres redis mongo kafka freellmapi
```

Start the API and agent in separate terminals:

```bash
pnpm dev:api
pnpm dev:agent
```

Start the web application in another terminal:

```bash
cd apps/web
pnpm dev
```

For local Python setup:

```bash
cd services/agent
uv sync
uv run fastapi dev src/main.py
```

## Database commands

```bash
pnpm --filter @Pearson/database build
pnpm --filter @Pearson/database db:migrate
pnpm --filter @Pearson/database db:generate
pnpm --filter @Pearson/database db:studio
```

Run these commands with `DATABASE_URL` pointing to a reachable PostgreSQL instance.

## Quality checks

From the repository root:

```bash
pnpm check-types
pnpm lint
pnpm build
```

API tests:

```bash
cd apps/api
pnpm test
pnpm test:e2e
```

## Operations

View service status and logs:

```bash
docker compose ps
docker compose logs -f api agent web
```

Stop the stack:

```bash
docker compose down
```

Stop the stack and remove persistent volumes:

```bash
docker compose down -v
```

The `-v` option deletes PostgreSQL data, Redis data, MongoDB data, FreeLLM data, and WhatsApp authentication volumes.

## Project structure

```text
Pearson/
├── apps/
│   ├── api/                 # NestJS API, Kafka, and Baileys sessions
│   └── web/                 # React and Vite frontend
├── packages/
│   ├── database/            # Drizzle schema and migrations
│   ├── eslint-config/       # Shared lint configuration
│   └── typescript-config/   # Shared TypeScript configuration
├── services/
│   └── agent/               # FastAPI, LangGraph, and RAG agent
├── scripts/
│   └── start.sh             # Full Docker setup and onboarding flow
├── docker-compose.yml       # Application and infrastructure services
├── package.json             # Workspace scripts
└── pnpm-workspace.yaml      # Workspace configuration
```

## Security

- Never commit `.env` files, API keys, database passwords, or WhatsApp session data.
- Change the default development credentials before exposing any service outside localhost.
- Treat restaurant login credentials and pairing codes as secrets.
- Add authentication, TLS, network restrictions, and secret management before deploying to production.

## License

PEARSON is intended to be an open-source project.
