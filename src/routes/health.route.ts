import { Router, Request, Response, NextFunction } from "express";

const router = Router();

// Store server start time for uptime calculation
const serverStartTime = Date.now();

/**
 * GET /health endpoint
 * Health check endpoint for Kubernetes probes
 * Returns JSON with status, timestamp (ISO 8601), and uptime in seconds
 * Responds quickly without artificial latency
 */
router.get("/health", (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Calculate uptime in seconds
    const uptimeMs = Date.now() - serverStartTime;
    const uptimeSeconds = Math.floor(uptimeMs / 1000);

    // Return health status
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: uptimeSeconds,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
