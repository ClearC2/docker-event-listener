import Docker from "dockerode";
import { z } from "zod";
import { env } from "./env";
import "dotenv/config";
import { serveMetrics } from "./prometheus";

const containerEventSchema = z.object({
  status: z.string(),
  id: z.string(),
  Type: z.literal("container"),
  Action: z.string(),
  time: z.number(), // unix timestamp
  Actor: z.object({
    Attributes: z.object({
      image: z.string(),
      name: z.string(),
    }),
  }),
});

async function startEventListener() {
  const docker = new Docker({ socketPath: env.DOCKER_SOCKET_PATH });

  const eventStream = await docker.getEvents();

  let buffer = "";

  eventStream.on("data", (chunk) => {
    buffer += chunk.toString();

    // The chunk can contain multiple json objects(not in an array) so
    // we need to parse them out based on the newline character
    let boundary;
    while ((boundary = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 1);
      if (!line) continue;
      try {
        const data = JSON.parse(line);
        const event = containerEventSchema.parse(data);
        // console.log(event);
        if (env.CONTAINER_EVENTS.includes(event.Action)) {
          // don't await on the resolution
          sendContainerEvent(event);
        }
      } catch (error) {
        // no-op parsing events
      }
    }
  });

  eventStream.on("error", (error) => {
    console.error("Error in Docker event stream:", error);
  });

  console.log("Started listing to docker events...");
}

async function sendContainerEvent(event: z.infer<typeof containerEventSchema>) {
  const payload = {
    [env.HOST_ID_PAYLOAD_KEY]: env.DOCKER_HOST_ID,
    token: env.TARGET_API_TOKEN,
    docker_event: {
      event_time: event.time,
      container_name: event.Actor.Attributes.name,
      [env.HOST_ID_PAYLOAD_KEY]: env.DOCKER_HOST_ID,
      event_name: event.Action,
      details: JSON.stringify(event),
    },
  };
  console.log("sending event", payload);
  try {
    const res = await fetch(env.TARGET_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error("Could not send event", await res.text());
    }
  } catch (e) {
    console.error("fetch() error", e);
  }
}

startEventListener().catch((err) => {
  console.error(err);
  process.exit(1);
});

serveMetrics(env.PORT);
