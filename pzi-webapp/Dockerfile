FROM node:22.16-slim as base

ARG APP_VERSION_FULL
ARG APP_VERSION_SHORT
ENV APP_VERSION_FULL=$APP_VERSION_FULL
ENV APP_VERSION_SHORT=$APP_VERSION_SHORT
ENV PRINT_TEMPATES_FOLDER /var/lib/metazoa/print-templates

WORKDIR /var/lib/metazoa/print-templates

COPY /print-templates/. .

WORKDIR /app

COPY package.json .
COPY package-lock.json .
COPY /build/. ./build/.

RUN npm ci --omit=dev

EXPOSE 3000

CMD ["npm", "run", "start"]
