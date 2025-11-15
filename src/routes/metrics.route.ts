import { Router, Request, Response, NextFunction } from "express";
import { register } from "../config/prometheus.js";

const router = Router();

/**
 * GET /metrics endpoint
 * Exposes Prometheus metrics in text format
 * Returns metrics from prom-client registry
 * Sets correct Content-Type header for Prometheus scraping
 */
router.get("/metrics", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Set the correct Content-Type header for Prometheus text format
    res.setHeader("Content-Type", register.contentType);

    // Get metrics from the registry in Prometheus text format
    const metrics = await register.metrics();

    // Send metrics as response
    res.status(200).send(metrics);
  } catch (error) {
    next(error);
  }
});

export default router;
