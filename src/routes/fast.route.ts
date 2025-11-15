import { type IRouter, type NextFunction, type Request, type Response, Router } from "express";

const router: IRouter = Router();

/**
 * GET /fast endpoint
 * Simulates a fast response with random latency between 0-500ms
 * Returns JSON with message, timestamp (ISO 8601), and actual latency
 */
router.get("/fast", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const startTime = Date.now();

    // Generate random latency between 0-500ms
    const latency = Math.floor(Math.random() * 501);

    // Simulate latency using Promise-based setTimeout
    await new Promise((resolve) => setTimeout(resolve, latency));

    const actualLatency = Date.now() - startTime;

    // Return response with ISO 8601 timestamp
    res.status(200).json({
      message: "Fast response",
      timestamp: new Date().toISOString(),
      latency: actualLatency,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
