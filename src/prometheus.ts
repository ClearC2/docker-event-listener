import http from "http";
import Docker from "dockerode";
import { env } from "./env";

const docker = new Docker({ socketPath: env.DOCKER_SOCKET_PATH });

async function getRestartCountsForPrometheus() {
  try {
    // Fetch all containers
    const containers = await docker.listContainers({ all: true });

    const restartMetrics = [];
    const upMetrics = [];
    const thresholdMetrics = [];

    for (const containerInfo of containers) {
      const container = docker.getContainer(containerInfo.Id);
      const inspectData = await container.inspect();

      // Add restart count metric for the container
      const restartCount = inspectData.RestartCount;
      const containerName = containerInfo.Names[0].replace(/^\//, ""); // Remove leading slash from the name
      const memoryPercentageThreshold =
        inspectData.Config.Labels.memory_alert_threshold_percentage ?? "0";
      const cpuPercentageThreshold =
        inspectData.Config.Labels.cpu_alert_threshold_percentage ?? "0";

      // Escape any special characters in container names for Prometheus format
      const escapedName = containerName.replace(/"/g, '\\"');
      restartMetrics.push(
        `docker_container_restart_count{name="${escapedName}"} ${restartCount}`,
      );
      upMetrics.push(
        `docker_container_up{name="${escapedName}"} ${inspectData.State.Running ? "1" : "0"}`,
      );
      thresholdMetrics.push(
        `docker_container_resource_threshold{name="${escapedName}",resource="memory"} ${memoryPercentageThreshold}`,
      );
      thresholdMetrics.push(
        `docker_container_resource_threshold{name="${escapedName}",resource="cpu"} ${cpuPercentageThreshold}`,
      );
    }

    let metrics =
      "# HELP docker_container_restart_count Restart count of Docker containers\n";
    metrics += "# TYPE docker_container_restart_count counter\n";
    metrics += restartMetrics.join("\n");
    metrics += "\n# HELP docker_container_up Status of Docker containers\n";
    metrics += "# TYPE docker_container_up gauge\n";
    metrics += upMetrics.join("\n");
    metrics +=
      "\n# HELP docker_container_resource_threshold Alerting threshold of containers\n";
    metrics += "# TYPE docker_container_resource_threshold gauge\n";
    metrics += thresholdMetrics.join("\n");

    return metrics;
  } catch (error) {
    console.error("Error fetching container restart counts:", error);
    throw error;
  }
}

// Example: Expose a simple HTTP server for Prometheus to scrape
export function serveMetrics() {
  return http
    .createServer(async (req, res) => {
      if (req.url === "/metrics") {
        try {
          const metrics = await getRestartCountsForPrometheus();
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end(metrics);
        } catch (error) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Error generating metrics");
        }
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
      }
    })
    .listen(3003, () => {
      console.log(
        "Prometheus metrics server is running on http://localhost:3003/metrics",
      );
    });
}
