# ============================================================
# Tipsy PWA — Multi-stage Dockerfile
#
# Stage 1 (builder): Bun Alpine — install deps and build
# Stage 2 (serve):   Nginx Alpine — serve the built dist/
#
# Build args must match all VITE_* variables in .env.example.
# Pass at build time: docker build --build-arg VITE_APP_DOMAIN=tipsy.emsr.cc .
# ============================================================

# ---- Stage 1: Build ----
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Install git for version detection via git describe
RUN apk add --no-cache git

# Install dependencies first (cached layer)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build-time environment variables (Vite bakes these into the bundle)
ARG VITE_APP_DOMAIN=auto
ARG VITE_APP_NAME=Tipsy
ARG VITE_DEFAULT_THEME=tipsy
ARG VITE_DEFAULT_LANG=de
ARG VITE_APP_VERSION
ARG VITE_OIDC_AUTHORITY
ARG VITE_OIDC_CLIENT_ID
ARG VITE_OIDC_REDIRECT_URI
ARG VITE_OIDC_SCOPE

# Copy source and build
COPY . .

# Fetch tags so git describe can produce a version like v0.2.2-3-gabcd123
RUN git fetch --unshallow --tags 2>/dev/null || git fetch --tags 2>/dev/null || true

RUN bun run build

# ---- Stage 2: Serve ----
FROM nginx:1.27-alpine AS serve

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage and set ownership to nginx user (UID 101)
# using --chown so files are not root-owned inside the image.
COPY --from=builder --chown=101:101 /app/dist /usr/share/nginx/html

# Ensure static files are readable by the nginx worker processes (fallback)
RUN chmod -R 755 /usr/share/nginx/html

# Simple HTTP healthcheck for orchestration
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -q --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
