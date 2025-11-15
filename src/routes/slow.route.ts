import { type NextFunction, type Request, type Response, Router, type IRouter } from "express";

const router: IRouter = Router();

/**
 * GET /slow endpoint
 * Simulates a slow response with random latency between 500-1000ms
 * Returns JSON with message, timestamp (ISO 8601), and actual latency
 */
router.get("/slow", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const startTime = Date.now();

    // Generate random latency between 500-1000ms
    const latency = Math.floor(Math.random() * 501) + 500;

    // Simulate latency using Promise-based setTimeout
    await new Promise((resolve) => setTimeout(resolve, latency));

    const actualLatency = Date.now() - startTime;

    // Return response with ISO 8601 timestamp
    res.status(200).json({
      message: "Slow response",
      timestamp: new Date().toISOString(),
      latency: actualLatency,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
