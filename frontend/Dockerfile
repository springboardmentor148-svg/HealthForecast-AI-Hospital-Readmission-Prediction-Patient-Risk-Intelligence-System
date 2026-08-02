# Step 1: Build React App (This defines the "build" stage name)
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Step 2: Serve React App using Nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html

# Enables fallback to index.html for React Router
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; try_files $uri /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]