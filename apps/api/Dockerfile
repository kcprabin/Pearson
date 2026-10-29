FROM node:24-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate

WORKDIR /app

# Copy root workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy packages required by api
COPY packages/database ./packages/database
COPY packages/typescript-config ./packages/typescript-config
COPY apps/api ./apps/api

# Install workspace dependencies
RUN pnpm install

# Build database package and api
RUN pnpm --filter @Pearson/database build
RUN pnpm --filter api build

WORKDIR /app/apps/api

EXPOSE 3000

# Copy and set up migration & startup entrypoint
COPY apps/api/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
