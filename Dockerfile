FROM node:20-alpine AS base
WORKDIR /app

# 安装依赖
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate

# 构建
COPY . .
RUN npm run build

# 生产镜像
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=base /app/public ./public
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma

# 确保 uploads 目录存在
RUN mkdir -p public/uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
