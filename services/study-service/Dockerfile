FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Study service port (assume 3003 based on sequence 3001, 3002, 3004, but let's check it later. I will just expose 3003 for now, and docker CMD covers it)
# Actually, I'll omit EXPOSE or just put 3003. We can map via docker-compose
EXPOSE 3003
CMD ["node", "server.js"]
