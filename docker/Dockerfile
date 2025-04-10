##### DEPENDENCIES

FROM --platform=linux/amd64 node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY .env .env

COPY prisma ./prisma

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm
RUN pnpm i --frozen-lockfile
RUN pnpm db:generate

##### BUILDER

FROM --platform=linux/amd64 node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY .env .env.production

RUN corepack enable pnpm 
RUN pnpm run build


##### RUNNER

FROM --platform=linux/amd64 node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs

CMD ["node", "server.js"]


