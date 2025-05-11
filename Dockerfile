# Base image
FROM node:20-alpine AS base
WORKDIR /app
# Install dependencies only when package.json changes
COPY package.json package-lock.json ./

# Builder stage
FROM base AS builder
RUN npm ci
COPY . .
# Generate Prisma Client
RUN npx prisma generate
# Build the application
RUN npm run build

# Production stage
FROM base AS runner
ENV NODE_ENV=production
# Install curl and production dependencies
RUN apk --no-cache add curl
RUN npm ci --only=production
# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
# Copy necessary files for Prisma and Next.js
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/next.config.js ./

# Setup a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs .
USER nextjs

EXPOSE 3000
# Initialize database and start the application
CMD npx prisma migrate deploy && npm start
