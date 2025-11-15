import express, { type Request, type Response, type NextFunction } from "express";
import { metricsMiddleware } from "./middleware/metrics.middleware.js";
import fastRoute from "./routes/fast.route.js";
import healthRoute from "./routes/health.route.js";
import metricsRoute from "./routes/metrics.route.js";
import slowRoute from "./routes/slow.route.js";

/**
 * Create and configure Express application
 * Registers metrics middleware on all routes
 * Registers all route handlers (/fast, /slow, /metrics, /health)
 * Adds global error handler middleware
 */
export function createApp() {
  const app = express();

  // Parse JSON request bodies
  app.use(express.json());

  // Register metrics middleware on all routes
  // This must be registered before route handlers to capture all requests
  app.use(metricsMiddleware);

  // Register route handlers
  app.use(fastRoute);
  app.use(slowRoute);
  app.use(healthRoute);
  app.use(metricsRoute);

  // Global error handler middleware
  // Must be registered after all routes
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    console.error("Error occurred:", {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
    });

    // Send error response
    res.status(500).json({
      error: "Internal Server Error",
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}

export default createApp;
