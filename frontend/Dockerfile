# Use a lightweight Node image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy only what's needed to run the app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy the compiled Next.js app and other necessary files
COPY .next .next
COPY public public
COPY next.config.mjs .
COPY tsconfig.json .
COPY node_modules node_modules

# Expose Next.js default port
EXPOSE 3000

# Run the production server
CMD ["npm", "start"]
