FROM node:20-alpine
WORKDIR /srv/app
COPY server/package.json server/package-lock.json* ./
COPY server/ ./
RUN npm install --production
ENV PORT=4000
EXPOSE 4000
CMD ["node","index.js"]
