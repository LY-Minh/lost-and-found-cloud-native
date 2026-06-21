FROM node:22-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force
COPY . .

EXPOSE 3005

USER node

CMD ["node", "src/index.js"]

