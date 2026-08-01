# Docker Multi-Stage Build for StatusFlow Background Worker
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/worker/ ./apps/worker/

RUN pnpm install --no-frozen-lockfile
# @statusflow/baileys-engine's package.json main/types point at its compiled dist/ (see its
# tsconfig.json) since apps/worker requires it at runtime via plain `node`, with no ts-node/register
# hook to transpile TypeScript on the fly the way `pnpm dev` does. It must be built before worker.
RUN pnpm --filter @statusflow/baileys-engine build
RUN pnpm --filter @statusflow/worker build

CMD ["node", "apps/worker/dist/index.js"]
