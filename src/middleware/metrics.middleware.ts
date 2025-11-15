import type { Request, Response } from "express";
import responseTime from "response-time";
import { httpRequestDuration, httpRequestsTotal } from "../config/prometheus.js";

/**
 * Metrics middleware that integrates response-time with prom-client
 * Captures request duration and records to histogram with labels (method, route, status_code)
 * Increments counter for each request with appropriate labels
 */
export const metricsMiddleware = responseTime((req: Request, res: Response, time: number) => {
  // Get the route path, fallback to the original URL if route is not available
  const route = req.route?.path || req.path || "unknown";

  // Get the HTTP method
  const method = req.method;

  // Get the status code
  const statusCode = res.statusCode.toString();

  // Convert time from milliseconds to seconds for Prometheus histogram
  const durationInSeconds = time / 1000;

  // Record the request duration in the histogram
  httpRequestDuration.labels(method, route, statusCode).observe(durationInSeconds);

  // Increment the request counter
  httpRequestsTotal.labels(method, route, statusCode).inc();
});
