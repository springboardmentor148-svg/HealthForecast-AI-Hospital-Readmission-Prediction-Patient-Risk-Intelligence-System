# Frontend Dockerfile — builds the Vite app, then serves it with nginx

# ---- Stage 1: Build ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# VITE_API_BASE_URL is baked into the build at build time — pass it via
# docker-compose.yml or --build-arg when building manually
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ---- Stage 2: Serve ----
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# React Router needs all unknown paths to fall back to index.html,
# otherwise refreshing a page like /patients gives an nginx 404
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]