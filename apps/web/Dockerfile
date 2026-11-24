FROM node:24-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

# Match the packageManager version declared by the workspace.
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# Copy pnpm configuration and workspace manifests before installing.
COPY .npmrc package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy only the web app's package.json first (for layer caching)
COPY apps/web/package.json ./apps/web/

# Include dev dependencies because Vite and @vitejs/plugin-react are required to start.
RUN pnpm install --frozen-lockfile --filter web... --prod=false

# Copy the full web app source (excluding any host node_modules if present)
COPY apps/web/ ./apps/web/

# Re-link workspace binaries cleanly in case host node_modules overwrote /app/apps/web/node_modules
RUN pnpm install --frozen-lockfile --offline --filter web... --prod=false

WORKDIR /app/apps/web

EXPOSE 5173

CMD ["pnpm", "exec", "vite", "--host", "0.0.0.0", "--port", "5173"]