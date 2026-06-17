# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
# Menginstall pnpm versi 9 agar kompatibel dengan lockfile versi 9.0
RUN npm install -g pnpm@9 && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Stage 2: Run the application
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV PORT 3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
