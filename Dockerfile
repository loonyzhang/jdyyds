FROM node:16.15.1-alpine

ARG QL_URL=127.0.0.1:9001

ENV NODE_ENV=production \
    APP_PATH=/app

WORKDIR $APP_PATH

COPY package.json $APP_PATH
RUN npm install

COPY . $APP_PATH

CMD npm start -- --qinglong=$QL_URL