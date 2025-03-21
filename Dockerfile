FROM node:22-bullseye-slim

RUN apt-get update && apt-get install -y python3 make g++

WORKDIR /app
COPY package*.json ./
RUN npm install pkg
RUN npm install
COPY . .

RUN npm run package