FROM node:24-alpine

WORKDIR /app

COPY package.json ./
COPY src ./src

ENV HOST=0.0.0.0
ENV PORT=4000

EXPOSE 4000

CMD ["node", "src/index.mjs"]
