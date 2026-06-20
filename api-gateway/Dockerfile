FROM nginx:alpine

# Install njs module
RUN apk add --no-cache nginx-mod-http-js

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy njs scripts
COPY njs/ /etc/nginx/njs/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
