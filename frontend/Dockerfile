FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

# Vite dev server launch for dev environment docker, or build serving
CMD ["npm", "run", "dev", "--", "--host"]
