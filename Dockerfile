FROM node:16.15.1-alpine

ENV NODE_ENV=production \
    APP_PATH=/app

WORKDIR $APP_PATH

COPY package.json $APP_PATH
RUN npm install

COPY . $APP_PATH

ENTRYPOINT ["npm", "start", "--"]