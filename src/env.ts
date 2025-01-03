import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  // Some identifier to correlate the source of these events
  DOCKER_HOST_ID: z.string(),

  // The payload key of the DOCKER_HOST_ID
  HOST_ID_PAYLOAD_KEY: z.string(),

  // Where the events should be sent
  TARGET_API_ENDPOINT: z.string(),

  // auth token to include in request
  TARGET_API_TOKEN: z.string(),

  // Which events to send (https://docs.docker.com/reference/cli/docker/system/events/#containers)
  CONTAINER_EVENTS: z
    .string()
    .optional()
    .transform((v) => {
      const value = v ?? "start,stop,die";
      return value.split(",").map((event) => event.trim().toLowerCase());
    }),

  // Docker socket path to attach to
  DOCKER_SOCKET_PATH: z
    .string()
    .optional()
    .transform((v) => {
      return v ?? "/var/run/docker.sock";
    }),

  PORT: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 3003)),
});

export const env = envSchema.parse(process.env);
