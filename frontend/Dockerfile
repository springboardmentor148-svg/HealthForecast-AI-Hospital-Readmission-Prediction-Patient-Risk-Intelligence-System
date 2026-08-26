# Stage 1: Build the React application
FROM node:20-alpine AS build-stage

WORKDIR /app

# Copy dependency definition files first for caching
COPY frontend/package*.json ./

# Install project dependencies
RUN npm ci

# Copy the frontend application files
COPY frontend/ ./

# Set the environment variable for Vite to target the same-origin API proxy endpoint
ENV VITE_API_BASE_URL=/api/v1

# Build the production bundle
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine

# Remove default static files
RUN rm -rf /usr/share/nginx/html/*

# Copy build artifacts from build stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
