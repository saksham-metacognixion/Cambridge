# syntax=docker/dockerfile:1
# Self-hosted build of the site (19 Oct 2026, "option 3"): runs on any Docker host (EC2, Azure, a VPS). Two small images,
# wired together by compose.yaml:
#   web    nginx serving the static build (dist/) + proxying /api/forms/* to `forms`   (deploy/docker/nginx.conf)
#   forms  the form handler on Node, one bundled file, no node_modules                (tools/docker/forms-server.ts)
# Pages never go through Node, so they load exactly as fast as on any static host.
# Build: `docker compose build` (reads the PUBLIC_* build args from .env, see .env.example).

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Public keys are baked into the HTML at build time (.env.example "Build time"); secrets are NOT build args (run time only).
ARG PUBLIC_TURNSTILE_SITE_KEY=
ARG PUBLIC_GOOGLE_MAPS_KEY=
ARG PUBLIC_SHOW_PENDING_NOTE=
ARG PUBLIC_COUNTRY_POPUP=
ENV PUBLIC_TURNSTILE_SITE_KEY=$PUBLIC_TURNSTILE_SITE_KEY \
    PUBLIC_GOOGLE_MAPS_KEY=$PUBLIC_GOOGLE_MAPS_KEY \
    PUBLIC_SHOW_PENDING_NOTE=$PUBLIC_SHOW_PENDING_NOTE \
    PUBLIC_COUNTRY_POPUP=$PUBLIC_COUNTRY_POPUP
RUN npm run build && node tools/nginx-redirect-map.mjs && node tools/docker/bundle.mjs

FROM nginx:1.27-alpine AS web
COPY deploy/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

FROM node:22-alpine AS forms
WORKDIR /app
ENV NODE_ENV=production PORT=8787
COPY --from=build /app/dist-server/forms-server.mjs ./
USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8787/healthz || exit 1
CMD ["node", "forms-server.mjs"]
