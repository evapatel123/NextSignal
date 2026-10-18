# syntax=docker/dockerfile:1.6

# -------- 1. Frontend build --------
FROM node:20-bookworm-slim AS frontend-build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

COPY tsconfig.json next.config.js tailwind.config.ts postcss.config.js components.json .eslintrc.json ./
COPY public ./public
COPY src ./src

ENV NEXT_TELEMETRY_DISABLED=1
ENV BACKEND_URL=http://127.0.0.1:8000
ENV NEXT_PUBLIC_BACKEND_BASE=/api/backend
RUN pnpm run build


# -------- 2. Runtime image --------
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    NEXT_TELEMETRY_DISABLED=1 \
    BACKEND_URL=http://127.0.0.1:8000 \
    NEXT_PUBLIC_BACKEND_BASE=/api/backend \
    PORT=3000 \
    AUTO_SEED=true

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY src/server ./src/server
COPY --from=frontend-build /app/.next/standalone ./
COPY --from=frontend-build /app/.next/static ./.next/static
COPY --from=frontend-build /app/public ./public

RUN mkdir -p /app/data

COPY docker/start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -fsS http://127.0.0.1:3000/ || exit 1

CMD ["./start.sh"]
