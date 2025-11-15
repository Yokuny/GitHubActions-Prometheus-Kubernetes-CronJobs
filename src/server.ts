import { createApp } from "./index.js";
import { startCronJobs, stopCronJobs } from "./cron/jobs.js";
import type { Server } from "node:http";

// Get port from environment variable or use default
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Create Express application
const app = createApp();

// Store server instance for graceful shutdown
let server: Server | null = null;

/**
 * Start the HTTP server and initialize cron jobs
 */
const startServer = (): void => {
  // Start HTTP server
  server = app.listen(PORT, () => {
    console.log("=".repeat(60));
    console.log("🚀 Server started successfully");
    console.log("=".repeat(60));
    console.log(`📍 Environment: ${NODE_ENV}`);
    console.log(`🌐 Server listening on port: ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📊 Metrics endpoint: http://localhost:${PORT}/metrics`);
    console.log(`⚡ Fast route: http://localhost:${PORT}/fast`);
    console.log(`🐌 Slow route: http://localhost:${PORT}/slow`);
    console.log("=".repeat(60));
  });

  // Start cron jobs after server is listening
  startCronJobs();
};

/**
 * Gracefully shutdown the server and stop all cron jobs
 * @param signal - The signal that triggered the shutdown (SIGTERM or SIGINT)
 */
const gracefulShutdown = (signal: string): void => {
  console.log("");
  console.log("=".repeat(60));
  console.log(`⚠️  Received ${signal} signal - Starting graceful shutdown...`);
  console.log("=".repeat(60));

  // Stop accepting new connections
  if (server) {
    server.close((err) => {
      if (err) {
        console.error("❌ Error closing server:", err);
        process.exit(1);
      }

      console.log("✅ HTTP server closed - No longer accepting connections");
      console.log("✅ Graceful shutdown completed successfully");
      console.log("=".repeat(60));
      process.exit(0);
    });

    // Force shutdown after 30 seconds if graceful shutdown hangs
    setTimeout(() => {
      console.error("⚠️  Graceful shutdown timeout - Forcing exit");
      process.exit(1);
    }, 30000);
  } else {
    console.log("⚠️  Server was not running");
    process.exit(0);
  }

  // Stop cron jobs immediately
  stopCronJobs();
};

// Register signal handlers for graceful shutdown
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  console.error("❌ Uncaught Exception:", error);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason: unknown) => {
  console.error("❌ Unhandled Rejection:", reason);
  gracefulShutdown("UNHANDLED_REJECTION");
});

// Start the server
startServer();
