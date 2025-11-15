import cron from "node-cron";

// Store cron job instances for graceful shutdown
let fastCronJob: cron.ScheduledTask | null = null;
let slowCronJob: cron.ScheduledTask | null = null;

// Get the base URL for making HTTP requests
// In production, this will be the service's own URL
const getBaseUrl = (): string => {
  const port = process.env.PORT || 8000;
  return `http://localhost:${port}`;
};

/**
 * Makes an HTTP GET request to the specified endpoint
 * @param endpoint - The endpoint to call (e.g., '/fast', '/slow')
 * @returns Promise that resolves when the request completes
 */
const callEndpoint = async (endpoint: string): Promise<void> => {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`[CRON ERROR] Failed to call ${endpoint}: HTTP ${response.status}`);
      return;
    }

    const data = (await response.json()) as { latency?: number };
    console.log(`[CRON] Successfully called ${endpoint} - Latency: ${data.latency}ms`);
  } catch (error) {
    console.error(`[CRON ERROR] Error calling ${endpoint}:`, error instanceof Error ? error.message : error);
  }
};

/**
 * Starts all cron jobs
 * - /fast route is called every 30 seconds
 * - /slow route is called every 1 minute
 */
export const startCronJobs = (): void => {
  console.log("[CRON] Starting cron jobs...");

  // Cron job to call /fast every 30 seconds
  // Pattern: "*/30 * * * * *" means every 30 seconds
  fastCronJob = cron.schedule(
    "*/30 * * * * *",
    async () => {
      await callEndpoint("/fast");
    },
    {
      scheduled: true,
      timezone: "UTC",
    }
  );

  // Cron job to call /slow every 1 minute
  // Pattern: "0 * * * * *" means at second 0 of every minute
  slowCronJob = cron.schedule(
    "0 * * * * *",
    async () => {
      await callEndpoint("/slow");
    },
    {
      scheduled: true,
      timezone: "UTC",
    }
  );

  console.log("[CRON] Cron jobs started successfully");
  console.log("[CRON] - /fast will be called every 30 seconds");
  console.log("[CRON] - /slow will be called every 1 minute");
};

/**
 * Stops all cron jobs gracefully
 * Should be called during application shutdown
 */
export const stopCronJobs = (): void => {
  console.log("[CRON] Stopping cron jobs...");

  if (fastCronJob) {
    fastCronJob.stop();
    console.log("[CRON] Stopped /fast cron job");
  }

  if (slowCronJob) {
    slowCronJob.stop();
    console.log("[CRON] Stopped /slow cron job");
  }

  console.log("[CRON] All cron jobs stopped");
};
