# Multi-stage Dockerfile for Node.js backend application
# Stage 1: Builder - Build TypeScript to JavaScript
FROM node:24-alpine AS builder

WORKDIR /app

# Install PNPM globally
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN pnpm build

# Stage 2: Production - Runtime with only production dependencies
FROM node:24-alpine

WORKDIR /app

# Install PNPM globally
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Expose application port
EXPOSE 3000

# Set NODE_ENV to production
ENV NODE_ENV=production

# Start the server
CMD ["node", "dist/server.js"]
