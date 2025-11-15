import express, { type Application, type Request, type Response } from "express";
import client from "prom-client";

const app: Application = express();

// const collectDefaultMetrics = client.collectDefaultMetrics;
// collectDefaultMetrics({ register: client.register });

export const reqResTime = new client.Histogram({
  name: "request_duration_seconds",
  help: "Duration of a requests in seconds",
  labelNames: ["method", "route", "status_code"],
  // Tempos em segundo. Valida se a requisição foi menor que o tempo
  buckets: [0.005, 0.05, 0.25, 0.5, 1, 2.5, 5, 10],
});

app.get("/metrics", async (_req: Request, res: Response) => {
  res.set("Content-Type", client.register.contentType);
  return res.send(await client.register.metrics());
});

export default app;
