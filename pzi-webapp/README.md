# PZI - Web App

## Overview

Frontend part of PZI project.

## Configuration environment variables

Following variables are used to configure application / docker container with application:
- `SESSION_SECRET` - secret key used to secure session cookies
- `PZI_API_KEY` - api key used to authenticate agains PZI API
- `PZI_API_HOST_URL` - PZI API host
- `ALLOW_TEST_LOGIN` - set `true` to enable `/test-login` endpoint to authorize without connecting to AD

## Setup locally

### Define .env file

- Create file named `.env` in root of `pzi-webapp`
  - see (https://www.npmjs.com/package/dotenv#%EF%B8%8F-usage) for env files 

Sample of configuration used for local development:

```
PZI_API_KEY=Key1
PZI_API_HOST_URL=http://host.containers.internal:5230
```


### DevContainers

Easiest way to run application locally is to use prepared DevContainer. 

Requirements:
- Docker or Podman installed
  - Docker is paid service from certain team size, so Podman (see https://podman.io) 
- DevContainers extension for VS Code (see https://code.visualstudio.com/docs/devcontainers/containers)

### Run directly on DEV machine

Requirements:
- NodeJs v 22.x installed


## CLI Commands

### Code check

npm run typecheck

### Local run

```
npm run dev
```

### Build and run 

First build production app:

```
npm run build
```

Then start aplication in production mode:

```
npm start
```

### Testing

Run unit tests

```
npm run test
```
