# Optional: run Svivva on any container host (Railway, Fly, ECS) when not using Vercel.
# Vercel does not use this file unless you switch to a Docker deployment.
#
# docker build -t svivva .
# docker run --env-file .env -p 5000:5000 svivva
#
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci 2>/dev/null || npm install

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/dist ./dist
EXPOSE 5000
CMD ["npm", "run", "start"]
