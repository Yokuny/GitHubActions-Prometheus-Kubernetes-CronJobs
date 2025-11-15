import { env, shutdownCronJobs } from "./config";
import app, { init } from "./index";
import metricsApp from "./metrics";

const port = env.PORT;

init().then(() => {
  const server = app.listen(port, () => {
    console.log(`[LOG] Server listening in http://localhost:${port}`);
  });

  metricsApp.listen(9090, () => {
    console.log(`[LOG] Metrics server listening in http://localhost:${9090}`);
  });

  const gracefulShutdown = (_signal: string) => {
    server.close(() => {
      shutdownCronJobs();
      process.exit(0);
    });

    setTimeout(() => {
      process.exit(1);
    }, 30000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
});
