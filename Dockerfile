# syntax=docker/dockerfile:1.7

# Multi-stage build: install deps, build web+api, prune to prod, then ship a slim runtime

FROM node:22-alpine AS base
WORKDIR /app
ENV PNPM_HOME="/usr/local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Enable Corepack so pnpm@10.x (from package.json) is used
RUN corepack enable

# --- Dependencies layer (cache-friendly) ---
FROM base AS deps
# Only copy manifests to maximize layer cache hits
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

# Pre-fetch store, then install workspace deps (including dev deps for build)
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm fetch
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install -r --frozen-lockfile

# --- Build layer ---
FROM deps AS build
COPY apps ./apps

# Build all packages (API + Web)
RUN pnpm -r build

# --- Runtime image ---
FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Default port (overridden by PaaS if provided)
ENV PORT=3000

# Prepare workspace manifests for filtered prod install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json

# Install only API production dependencies
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm fetch --prod --filter @anki/api && \
    pnpm install --prod --frozen-lockfile --filter @anki/api

# Copy API build output and SPA static assets
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/web/dist ./apps/web/dist

EXPOSE 3000

# Simple healthcheck against the API root
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Start the API (which can serve static SPA in a follow-up change)
CMD ["node", "apps/api/dist/index.js"]
