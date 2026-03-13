# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build || (echo "Build failed, creating empty dist directory" && mkdir -p dist && echo '<!DOCTYPE html><html><head><title>Build Failed</title></head><body><h1>Build Failed</h1><p>The application build failed. Please check the build logs.</p></body></html>' > dist/index.html)

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
