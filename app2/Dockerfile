FROM node:18-alpine AS builder

COPY package.json .
# 依存関係のインストール
RUN npm install

COPY . .

# プロダクトステージ
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /node_modules ./node_modules
COPY --from=builder /package.json /package-lock.json ./
COPY --from=builder /app.ts /inst.ts /logger.ts /customMetrics.ts ./

CMD ["npm", "start"]
