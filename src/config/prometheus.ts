import { Counter, Histogram, Registry, collectDefaultMetrics } from "prom-client";

// Create a Registry to register the metrics
export const register = new Registry();

// Enable collection of default Node.js metrics (event loop, heap, GC)
collectDefaultMetrics({
  register,
  prefix: "nodejs_",
});

// Histogram metric for HTTP request duration
export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.05, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

// Counter metric for total HTTP requests
export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});
