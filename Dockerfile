# ============================================================
# Tipsy PWA — Multi-stage Dockerfile
#
# Stage 1 (builder): Node 20 Alpine — install deps and build
# Stage 2 (serve):   Nginx Alpine — serve the built dist/
#
# Build args must match all VITE_* variables in .env.example.
# Pass at build time: docker build --build-arg VITE_APP_DOMAIN=tipsy.emsr.cc .
# ============================================================

# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (cached layer)
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# Build-time environment variables (Vite bakes these into the bundle)
ARG VITE_APP_DOMAIN
ARG VITE_APP_NAME=Tipsy
ARG VITE_DEFAULT_THEME=tipsy
ARG VITE_DEFAULT_LANG=de
ARG VITE_OIDC_AUTHORITY
ARG VITE_OIDC_CLIENT_ID
ARG VITE_OIDC_REDIRECT_URI
ARG VITE_OIDC_SCOPE

# Copy source and build
COPY . .
RUN npm run build

# ---- Stage 2: Serve ----
FROM nginx:1.27-alpine AS serve

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
