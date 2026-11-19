FROM node:20-alpine

WORKDIR /app

# Copy root workspace files needed for pnpm workspaces
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy only the web app's package.json first (for layer caching)
COPY apps/web/package.json ./apps/web/

# Install pnpm and dependencies
RUN npm install -g pnpm --no-fund --no-audit --loglevel=error \
 && pnpm install --frozen-lockfile --filter web...

# Copy the full web app source
COPY apps/web/ ./apps/web/

WORKDIR /app/apps/web

EXPOSE 5173

CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5173"]
