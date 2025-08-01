#syntax=docker/dockerfile:1.7-labs

FROM node:lts-alpine AS base

FROM base AS builder
WORKDIR /app
COPY .npmrc package-lock.json package.json ./
COPY --parents **/package.json .

# Cache .nx directory so it retrive from cache next time
RUN npm ci --legacy-peer-deps
COPY . .

# Keep the API URL empty to use the same host
ARG VITE_AGENT_BASE_URL=http://localhost:1420
ENV VITE_AGENT_BASE_URL=$VITE_AGENT_BASE_URL
ENV VITE_API_URL=/
ENV NX_DAEMON=false
RUN ./node_modules/.bin/nx run-many -t build --projects backend,frontend -c production


FROM builder AS packages
WORKDIR /app
RUN mkdir -p all-dists
RUN find packages -name dist -type d | while read d; do \
      # Get the relative path from packages/ and remove /dist suffix
      pkg_path=$(echo "$d" | sed 's|^packages/||' | sed 's|/dist||'); \
      mkdir -p "all-dists/$pkg_path"; \
      cp -r "$d"/* "all-dists/$pkg_path/"; \
    done
RUN find packages -path "*/src/prisma" -type d | while read p; do \
      # Get the relative path from packages/ and copy src/prisma
      pkg_path=$(echo "$p" | sed 's|^packages/||' | sed 's|/src/prisma||'); \
      mkdir -p "all-dists/$pkg_path/src"; \
      cp -r "$p" "all-dists/$pkg_path/src/"; \
    done

FROM base AS start
WORKDIR /app

COPY --from=packages /app/all-dists ./packages

# Frontend APPS
COPY --from=builder /app/apps/frontend/dist ./apps/frontend/dist


# Backend APPS
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Install production dependencies
COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm config set registry https://registry.npmjs.org/
RUN npm ci --legacy-peer-deps --omit=dev --ignore-scripts

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
USER node
EXPOSE 3000
HEALTHCHECK CMD wget --no-verbose --spider --tries=1 http://localhost:3000 || exit 1
CMD ["node", "apps/backend"]
