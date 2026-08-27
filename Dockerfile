# syntax=docker/dockerfile:1

# ---- Этап 1: сборка фронтенда (Vite) ----
FROM node:22-alpine AS web-build
ARG VITE_API_BASE=/api
ENV VITE_API_BASE=${VITE_API_BASE}
WORKDIR /app/apps/web
COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci
COPY apps/web/ ./
RUN npm run build

# ---- Этап 2: рантайм (Express API + статика фронтенда) ----
FROM node:22-alpine
ENV NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/data \
    TZ=UTC
WORKDIR /app

COPY apps/api/package.json apps/api/package-lock.json apps/api/
RUN cd apps/api && npm ci --omit=dev && npm cache clean --force

COPY apps/api/server.js apps/api/storage.js apps/api/
COPY apps/config.js apps/
COPY --from=web-build /app/apps/web/dist apps/web/dist

RUN mkdir -p /data && chown -R node:node /app /data
USER node

VOLUME /data
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/event-types > /dev/null || exit 1

CMD ["node", "apps/api/server.js"]
