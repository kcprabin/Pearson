FROM node:24-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate

WORKDIR /app

# Copy root workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/

# Install dependencies for web
RUN pnpm install --filter @myapp/web...

# Copy web source code
COPY apps/web ./apps/web

WORKDIR /app/apps/web

EXPOSE 5173

CMD ["pnpm", "run", "dev", "--host", "0.0.0.0", "--port", "5173"]
