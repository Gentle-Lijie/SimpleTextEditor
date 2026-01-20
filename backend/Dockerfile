# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm and build dependencies for better-sqlite3
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Install pnpm and runtime dependencies for better-sqlite3
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built files
COPY --from=builder /app/dist ./dist

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3001

CMD ["node", "dist/index.js"]
