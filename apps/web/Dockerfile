FROM node:24-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

# Enable corepack and pin pnpm to match packageManager field
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate

# Copy root workspace files needed for pnpm workspaces
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy only the web app's package.json first (for layer caching)
COPY apps/web/package.json ./apps/web/

# Install dependencies (frozen to match lockfile)
RUN pnpm install --frozen-lockfile --filter web...

# Copy the full web app source
COPY apps/web/ ./apps/web/

WORKDIR /app/apps/web

EXPOSE 5173

CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5173"]
