# docker-event-listener

Simple service to listen to Docker events and send them to an api

## Configuration
The following environment variables need to be set. Can be an `.env` file in the root of this app.

```env
DOCKER_HOST_ID=abc
HOST_ID_PAYLOAD_KEY=oson_algorithm_environment_unid
TARGET_API_ENDPOINT=http://localhost:6089/api/docker/event
TARGET_API_TOKEN=abc
CONTAINER_EVENTS=start,stop,die
DOCKER_SOCKET_PATH=/var/run/docker.sock
```

- `DOCKER_HOST_ID` - Some unique identifier to correlate the events to a Docker host.
- `HOST_ID_PAYLOAD_KEY` - The json payload key that will contain the `DOCKER_HOST_ID`.
- `TARGET_API_ENDPOINT` - Where to send the events.
- `TARGET_API_TOKEN` - Will be included as `token` in the request payload.
- `CONTAINER_EVENTS` - A comma delimitted list of which events to listen to. A complete list of events can be found [here](https://docs.docker.com/reference/cli/docker/system/events/#containers).
- `DOCKER_SOCKET_PATH` - Where the Docker socket lives.

## Setup
Install the dependencies

```shell
npm install
```

## Running the application
Various ways to run the application include:

## Development

```shell
cp .example.env .env
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
  --env-file /srv/docker-event-listener/app.env
  -v /var/run/docker.sock:/var/run/docker.sock \
  -p 3003:3003 \
  clearc2/docker-event-listener:0.0.2
  ```

### Docker packaging
```shell
docker build --platform=linux/amd64 -t clearc2/docker-event-listener:0.0.3 .
docker push clearc2/docker-event-listener:0.0.4
```

### Testing
To test if the restart count goes up, you can forcefully kill a container that **has a restart policy**.

```shell
docker exec <container-id> kill 1
```

Then visit the metricts endpoint: http://localhost:3003/metrics
