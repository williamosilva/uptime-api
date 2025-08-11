# Dockerfile
FROM node:18-alpine AS base

# Instalar dependências necessárias
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Stage de desenvolvimento
FROM base AS development
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# Stage de build
FROM base AS builder
RUN npm ci
COPY . .
RUN npm run build

# Stage de produção
FROM node:18-alpine AS production

WORKDIR /app

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copiar arquivos de dependências
COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

# Copiar build da aplicação
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

USER nestjs

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/main"]