# Docker Multi-Stage Build for StatusFlow API + Web Dashboard
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm typescript

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/

RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @statusflow/web build
# @statusflow/subscriptions' package.json main/types point at its compiled dist/ (see its
# tsconfig.json) since apps/api requires it at runtime via plain `node`, with no ts-node/register
# hook to transpile TypeScript on the fly the way `pnpm dev` does. It must be built before api.
RUN pnpm --filter @statusflow/subscriptions build
RUN pnpm --filter @statusflow/api build

EXPOSE 5000
CMD ["node", "apps/api/dist/index.js"]
