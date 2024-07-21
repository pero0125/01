# ベースイメージの指定
FROM node:18-alpine

# 作業ディレクトリの作成
WORKDIR /app

COPY ./package.json .

COPY ./app.ts .
COPY ./inst.ts .
COPY ./logger.ts .
COPY ./customMetrics.ts .

RUN npm install

# コンテナ起動時にNext.jsアプリを実行
CMD ["npm", "start"]