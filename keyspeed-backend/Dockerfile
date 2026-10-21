# ==========================================
# KeySpeed Backend Dockerfile (Multi-stage)
# ==========================================

# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build TypeScript
COPY tsconfig*.json ./
COPY src/ ./src/
RUN npm run build

# Stage 2: Production Runtime
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy dependency manifests and install production-only dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled files from builder
COPY --from=builder /app/dist ./dist

# Create a non-root user for container security
USER node

EXPOSE 3001

CMD ["node", "dist/main.js"]

