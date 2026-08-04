FROM nginx:alpine

# Install envsubst (gettext) for variable substitution
RUN apk add --no-cache gettext

# Copy the HTML template and static assets
COPY index.html /usr/share/nginx/html/index.html.template
COPY pic.jpg /usr/share/nginx/html/pic.jpg

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]