FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Устанавливаем все зависимости, включая devDependencies
RUN npm install

COPY . .

# Запускаем в режиме разработки
CMD ["npm", "run", "start:dev"]