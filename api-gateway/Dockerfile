FROM alpine:3.20

RUN apk add --no-cache nginx nginx-mod-http-js

COPY nginx.conf /etc/nginx/nginx.conf

COPY njs/ /etc/nginx/njs/

EXPOSE 80


CMD ["nginx", "-g", "daemon off;"]

