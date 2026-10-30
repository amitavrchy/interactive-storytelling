FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npm run build
ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000
USER node
CMD ["node", "dist/main.js"]
