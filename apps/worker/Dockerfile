# Docker Multi-Stage Build for StatusFlow Background Worker
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/worker/ ./apps/worker/

RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @statusflow/worker build

CMD ["node", "apps/worker/dist/index.js"]
