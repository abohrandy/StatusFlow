# Docker Multi-Stage Build for StatusFlow Background Worker
# Kept on the same Node version as apps/api's Dockerfile for consistency — see the comment
# there on why Node 22+ is required (a transitive @supabase/supabase-js dependency needs the
# native WebSocket global Node 20 doesn't have).
FROM node:22-alpine AS base
WORKDIR /app
# Pinned to match package.json's "packageManager" — see apps/api/Dockerfile for why an
# unpinned `npm install -g pnpm` breaks `pnpm install --frozen-lockfile` below.
RUN npm install -g pnpm@10.33.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/worker/ ./apps/worker/

# --frozen-lockfile: install exactly what's in pnpm-lock.yaml rather than silently
# re-resolving dependencies within semver range on every build — see apps/api/Dockerfile.
RUN pnpm install --frozen-lockfile
# @statusflow/baileys-engine's package.json main/types point at its compiled dist/ (see its
# tsconfig.json) since apps/worker requires it at runtime via plain `node`, with no ts-node/register
# hook to transpile TypeScript on the fly the way `pnpm dev` does. It must be built before worker.
RUN pnpm --filter @statusflow/baileys-engine build
RUN pnpm --filter @statusflow/worker build

CMD ["node", "apps/worker/dist/index.js"]
