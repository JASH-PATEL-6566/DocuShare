# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Stage 2: Run
FROM node:22-alpine

WORKDIR /app

# Copy production dependencies
COPY --from=builder /app/package*.json ./
RUN npm install --only=production

# Copy build output
COPY --from=builder /app/dist ./dist

# Copy .env
COPY .env .env

# Expose backend port
EXPOSE 3001

CMD ["node", "dist/server.js"]
