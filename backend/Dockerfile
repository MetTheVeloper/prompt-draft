FROM node:24-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY src ./src

ENV HOST=0.0.0.0
ENV PORT=4000

EXPOSE 4000

CMD ["node", "src/index.mjs"]
