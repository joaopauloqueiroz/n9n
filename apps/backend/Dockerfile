############################
# Base / Build stage
############################
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm@10

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

# Install ALL deps (needed for build + prisma)
RUN pnpm install --frozen-lockfile

############################
# Prisma generate (types)
############################
WORKDIR /app/apps/backend
RUN pnpm db:generate

############################
# Build shared
############################
WORKDIR /app/packages/shared
RUN pnpm build

############################
# Build backend
############################
WORKDIR /app/apps/backend
RUN pnpm build


############################
# Production stage
############################
FROM node:18-alpine AS production

# Install pnpm
RUN npm install -g pnpm@10

# Runtime dependencies (Chromium + Postgres)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    postgresql-client \
    openssl

# Puppeteer config
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

# Install ONLY production deps
RUN pnpm install --prod --frozen-lockfile

# Copy build artifacts
COPY --from=base /app/packages/shared/dist ./packages/shared/dist
COPY --from=base /app/apps/backend/dist ./apps/backend/dist

# Safety check
RUN test -f /app/apps/backend/dist/apps/backend/src/main.js \
  || (echo "❌ main.js not found" && find /app/apps/backend/dist -name "main.js" && exit 1)

############################
# Prisma Client (runtime-safe)
############################
WORKDIR /app/apps/backend
RUN pnpm db:generate

# Prisma CLI for migrations
RUN npm install -g prisma@^5.8.0

############################
# Entrypoint
############################
COPY apps/backend/docker-entrypoint.sh /app/apps/backend/docker-entrypoint.sh
RUN chmod +x /app/apps/backend/docker-entrypoint.sh

EXPOSE 3041

ENTRYPOINT ["/app/apps/backend/docker-entrypoint.sh"]
