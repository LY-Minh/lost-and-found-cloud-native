FROM nginx:alpine

# Install njs module
RUN apk add --no-cache nginx-mod-http-js

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy njs scripts
COPY njs/ /etc/nginx/njs/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]

