# syntax=docker/dockerfile:1.7
FROM node:20.18.0 AS deps
WORKDIR /app
COPY package*.json ./
# 添加系统构建工具用于原生模块 (oxide 等) 需要时从源码编译
RUN apt-get update && apt-get install -y --no-install-recommends build-essential python3 ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm ci

FROM node:20.18.0 AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 重新安装并重建 lightningcss 以及 oxide
RUN rm -rf node_modules/lightningcss \
  && npm install --force lightningcss \
  && npm rebuild lightningcss \
  && npm rebuild @tailwindcss/oxide || npm install --force @tailwindcss/oxide
# 如需临时禁用原生 oxide，可取消下一行注释:
# ENV TAILWIND_DISABLE_OXIDE=1
RUN npm run build

FROM node:20.18.0 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=80
# 若在上面启用了禁用氧化层，这里也同步:
# ENV TAILWIND_DISABLE_OXIDE=1
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
RUN npm prune --omit=dev
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
# 为非 root 用户授予绑定 80 的能力
RUN apt-get update && apt-get install -y --no-install-recommends libcap2-bin \
  && setcap 'cap_net_bind_service=+ep' /usr/local/bin/node \
  && rm -rf /var/lib/apt/lists/*
EXPOSE 80
USER node
CMD ["npm","run","start","--","-p","80"]
