FROM alpine:3.20

# Install nginx + njs module from the same repo (versions match)
RUN apk add --no-cache nginx nginx-mod-http-js

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy njs scripts
COPY njs/ /etc/nginx/njs/

EXPOSE 80


CMD ["nginx", "-g", "daemon off;"]

