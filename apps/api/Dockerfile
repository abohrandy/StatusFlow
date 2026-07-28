# Docker Multi-Stage Build for StatusFlow API Gateway
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @statusflow/api build

EXPOSE 5000
CMD ["node", "apps/api/dist/index.js"]
