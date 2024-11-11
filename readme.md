# docker-event-listener

Simple service to listen to Docker events and send them to an api

## Configuration
The following environment variables need to be set. Can be an `.env` file in the root of this app.

```env
DOCKER_HOST_ID=abc
HOST_ID_PAYLOAD_KEY=oson_algorithm_environment_unid
TARGET_API_HOST=http://localhost:6089
CONTAINER_EVENTS=start,stop,die
```

- `DOCKER_HOST_ID` - Some unique identifier to correlate the events to a Docker host
- `HOST_ID_PAYLOAD_KEY` - The json payload key that will contain the `DOCKER_HOST_ID`.
- `TARGET_API_HOST` - Where to send the events
- `CONTAINER_EVENTS` - a comma delimitted list of which events to listen to. A complete list of events can be found [here](https://docs.docker.com/reference/cli/docker/system/events/#containers).

## Setup
Install the dependencies

```shell
npm install
```

## Running the application
Various ways to run the application include:

## Development

```shell
npm run dev
```

## Production
If the server has node, start the application:

```shell
npm start
```

## (Production) Docker
Use a prebuilt image:

```shell
docker run -d \
  --restart \
  --unless-stopped \
  --name docker-event-listener \
  # replace with wherever your .env lives
  --env-file /usr/apps/docker-event-listener/.env
  -v /var/run/docker.sock:/var/run/docker.sock \
  clearc2/docker-event-listener:0.0.1
```

### Docker packaging
```shell
docker build -t clearc2/docker-event-listener:0.0.1 .
docker push clearc2/docker-event-listener:0.0.1
```
