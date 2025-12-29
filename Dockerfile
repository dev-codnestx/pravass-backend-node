# development stage
FROM node:14-alpine as base

WORKDIR /usr/src/app

COPY package.json npm.lock tsconfig.json ecosystem.config.json ./

COPY ./src ./src

RUN ls -a

RUN npm install --pure-lockfile && npm compile

# production stage

FROM base as production

WORKDIR /usr/prod/app

ENV NODE_ENV=production

COPY package.json npm.lock ecosystem.config.json ./

RUN npm install --production --pure-lockfile

COPY --from=base /usr/src/app/dist ./dist
