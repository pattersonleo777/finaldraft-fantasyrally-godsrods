FROM node:20-alpine AS builder
WORKDIR /app
COPY ./mobile-app/package.json ./mobile-app/package-lock.json* ./mobile-app/
COPY ./mobile-app/ ./mobile-app/
WORKDIR /app/mobile-app
RUN npm install && npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/mobile-app/dist /usr/share/nginx/html
COPY ./mobile-app/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
