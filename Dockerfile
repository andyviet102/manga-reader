FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc && cp src/data.json dist/data.json
RUN npm prune --omit=dev
EXPOSE 3000
CMD ["node", "dist/index.js"]
