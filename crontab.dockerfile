FROM node:17-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY ["package.json", "./"]
RUN npm install

COPY . .
EXPOSE 8080

CMD ["node", "/usr/src/app/crontab/crontab.js"]