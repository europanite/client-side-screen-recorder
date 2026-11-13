FROM node:24-bookworm-slim

WORKDIR /app

COPY app/package*.json ./

RUN npm install --no-audit --no-fund

COPY app ./

CMD ["npm", "run", "dev"]
