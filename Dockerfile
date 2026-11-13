FROM node:22-alpine
WORKDIR /project/frontend/app
COPY frontend/app/package.json ./package.json
RUN npm install --no-audit --no-fund
COPY frontend/app ./
COPY tests /project/tests
CMD ["npm", "run", "dev"]
