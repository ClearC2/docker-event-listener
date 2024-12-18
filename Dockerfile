FROM node:20.17.0-alpine3.20 AS base
LABEL project=docker-event-listener
LABEL stage=base

WORKDIR /app

FROM base AS builder
ARG RUN_TESTS=false
LABEL project=docker-event-listener
LABEL stage=builder

WORKDIR /app

COPY package*.json tsconfig.json ./

COPY ./src ./src

RUN npm install
RUN npm run build

RUN npm prune --production

FROM node:20.17.0-alpine3.20 as release
LABEL project=docker-event-listener
LABEL stage=release
LABEL autoheal=true

ENV NODE_ENV=production

RUN apk add --no-cache dumb-init

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src ./src

EXPOSE 3003

CMD ["dumb-init", "node", "src/index.js"]
