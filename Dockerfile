# Base image
FROM node:20-alpine AS base
WORKDIR /app
# Install dependencies only when package.json changes
COPY package.json package-lock.json ./

# Builder stage
FROM base AS builder
# Use npm retry and network timeout configuration for better reliability
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5
# Install dependencies with retry mechanism
RUN for i in $(seq 1 5); do npm ci && break || sleep 15; done
COPY . .
# Create logs directory
RUN mkdir -p logs
# Generate Prisma Client
RUN npx prisma generate
# Build the application
RUN npm run build

# Production stage
FROM base AS runner
ENV NODE_ENV=production
# Set a default DATABASE_URL if not provided at runtime
ENV DATABASE_URL="postgresql://postgres:${POSTGRES_PASSWORD:-hydrolog_password}@postgres:5432/hydrolog?schema=public"
# Install curl and PostgreSQL client for connectivity checks
RUN apk --no-cache add curl postgresql-client
# Configure npm for better network resilience
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5
# Install production dependencies with retries and updated syntax (--omit=dev instead of --only=production)
RUN for i in $(seq 1 5); do npm ci --omit=dev && break || sleep 15; done
# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
# Copy necessary files for Prisma and Next.js
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/generate-jwt-secret.js ./

# Create logs directory
RUN mkdir -p logs

# Copy entry point script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Setup a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs .
USER nextjs

EXPOSE 3000
# Use entry point script to initialize environment and start application
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
