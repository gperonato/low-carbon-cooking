FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy all application files
COPY . .

# Expose port 8080
EXPOSE 8080

# Start the application
CMD ["node", "api.js"]
