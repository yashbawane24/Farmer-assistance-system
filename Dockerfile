# --- Stage 1: Build Frontend Client ---
FROM node:20-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# --- Stage 2: Production Server ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5001

# Copy server files and install production dependencies
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ ./

# Copy built frontend assets from stage 1 into client/dist
WORKDIR /app/client
COPY --from=client-builder /app/client/dist ./dist

# Return to root workdir
WORKDIR /app

EXPOSE 5001

CMD ["node", "server/index.js"]
