# Docker Multi-Stage Build for StatusFlow API + Web Dashboard
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm typescript

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/

RUN pnpm install --no-frozen-lockfile
# @statusflow/subscriptions' package.json "types" points at its compiled dist/index.d.ts (see
# its tsconfig.json) since apps/api requires it at runtime via plain `node`, with no ts-node/
# register hook to transpile TypeScript on the fly the way `pnpm dev` does. This must run
# before EITHER downstream build: web's own `tsc` type-check step also resolves
# @statusflow/subscriptions' types via that same "types" field (the "module" field only
# redirects bundlers' runtime resolution, not tsc's type-checking), so it fails the same way
# api would if this ran after web instead of before both.
RUN pnpm --filter @statusflow/subscriptions build
RUN pnpm --filter @statusflow/web build
RUN pnpm --filter @statusflow/api build

EXPOSE 5000
CMD ["node", "apps/api/dist/index.js"]
