# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
WORKDIR /app

COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV NITRO_PORT=3000
ENV NITRO_HOST=0.0.0.0
ENV DATABASE_URL=/data/gym-tracker.db

# Keep node_modules (including drizzle-kit) so migrations can run at container startup.
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY drizzle ./drizzle
COPY drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/.output ./.output

RUN mkdir -p /data && chown -R node:node /app /data

USER node
EXPOSE 3000

# Safe to run on every boot; migrations are idempotent.
CMD ["sh", "-c", "npm run db:migrate && node .output/server/index.mjs"]
