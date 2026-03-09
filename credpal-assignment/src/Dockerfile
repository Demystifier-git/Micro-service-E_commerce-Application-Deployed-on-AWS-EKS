# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install --production

COPY . .

# Stage 2: Run
FROM node:20-alpine


RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=build /app /app

USER appuser

EXPOSE 3000
CMD ["node", "src/index.js"]