# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# base — shared runtime: Node + pnpm + ffmpeg (transcode audio) + python3
# (the yt-dlp shipped by youtube-dl-exec is a Python script, not a static binary).
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# Pre-install pnpm into a shared, world-readable location so neither root nor the `node` user
# triggers an interactive corepack download at runtime.
ENV COREPACK_HOME=/usr/local/corepack
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@11.5.3 --activate
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg python3 ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---------------------------------------------------------------------------
# builder — installs all deps (compiling native modules) and builds the TS.
# ---------------------------------------------------------------------------
FROM base AS builder
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY tsconfig.json ./
COPY src ./src
RUN pnpm build
RUN pnpm prune --prod

# ---------------------------------------------------------------------------
# dev — hot-reload target (tsx watch). Source is bind-mounted via compose.
# ---------------------------------------------------------------------------
FROM base AS dev
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
CMD ["pnpm", "dev"]

# ---------------------------------------------------------------------------
# runtime — slim production image: ffmpeg + pruned node_modules + built JS.
# ---------------------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production
COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
USER node
CMD ["node", "dist/index.js"]
