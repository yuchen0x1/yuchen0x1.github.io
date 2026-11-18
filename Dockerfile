FROM nginx:stable-alpine
COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY dist/ /usr/share/nginx/html/
USER nginx
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
