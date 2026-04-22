# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Generate build hash for cache busting
ARG BUILD_HASH
ARG BUILD_VERSION
ENV VITE_BUILD_HASH=$BUILD_HASH
ENV VITE_BUILD_VERSION=$BUILD_VERSION

# Copy package files
COPY package*.json ./

# Clean install dependencies (force rebuild)
RUN npm ci --force

# Copy source code
COPY . .

# Build application with cache busting
RUN ESBUILD_BINARY_PATH=/usr/local/bin/esbuild npm run build

# Create build info file
RUN echo "{\"buildHash\":\"${VITE_BUILD_HASH}\",\"buildVersion\":\"${VITE_BUILD_VERSION}\",\"buildTime\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > /app/dist/build-info.json

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
