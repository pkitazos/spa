FROM --platform=$BUILDPLATFORM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY . .

RUN corepack enable pnpm
RUN pnpm i --frozen-lockfile
RUN pnpm run build

FROM node:22-alpine AS runner
LABEL org.opencontainers.image.source="https://github.com/pkitazos/spa"
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production \ 
    NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs

CMD ["node", "server.js"]


