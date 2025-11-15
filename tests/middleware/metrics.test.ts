import { describe, it, expect, vi, beforeEach } from "vitest";
import express, { type Express } from "express";
import request from "supertest";
import { metricsMiddleware } from "../../src/middleware/metrics.middleware.js";
import { httpRequestDuration, httpRequestsTotal, register } from "../../src/config/prometheus.js";

describe("Metrics Middleware", () => {
  let app: Express;

  beforeEach(async () => {
    // Reset metrics before each test
    register.resetMetrics();

    // Create a fresh Express app for each test
    app = express();

    // Apply metrics middleware
    app.use(metricsMiddleware);
  });

  describe("Request Duration Recording", () => {
    it("should record request duration to histogram", async () => {
      // Add a test route
      app.get("/test", (req, res) => {
        res.status(200).json({ message: "test" });
      });

      // Make a request
      const response = await request(app).get("/test");

      // Verify response
      expect(response.status).toBe(200);

      // Get metrics and verify histogram was recorded
      const metrics = await register.metrics();
      expect(metrics).toContain("http_request_duration_seconds");
      expect(metrics).toContain('method="GET"');
      expect(metrics).toContain('route="/test"');
      expect(metrics).toContain('status_code="200"');
    });

    it("should convert milliseconds to seconds correctly", async () => {
      // Add a test route with artificial delay
      app.get("/slow", async (req, res) => {
        await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay
        res.status(200).json({ message: "slow" });
      });

      const response = await request(app).get("/slow");

      expect(response.status).toBe(200);

      // Get metrics and verify the histogram recorded the duration
      const metrics = await register.metrics();
      expect(metrics).toContain("http_request_duration_seconds");
      expect(metrics).toContain('route="/slow"');

      // The histogram should have recorded at least one observation
      expect(metrics).toMatch(/http_request_duration_seconds_count\{.*route="\/slow".*\}\s+1/);
    });

    it("should handle fast responses", async () => {
      app.get("/fast", (req, res) => {
        res.status(200).json({ message: "fast" });
      });

      const response = await request(app).get("/fast");

      expect(response.status).toBe(200);

      // Get metrics and verify histogram recorded the fast response
      const metrics = await register.metrics();
      expect(metrics).toContain("http_request_duration_seconds");
      expect(metrics).toContain('route="/fast"');
      expect(metrics).toMatch(/http_request_duration_seconds_count\{.*route="\/fast".*\}\s+1/);
    });
  });

  describe("Request Counter Increment", () => {
    it("should increment counter for requests", async () => {
      app.get("/test", (req, res) => {
        res.status(200).json({ message: "test" });
      });

      const response = await request(app).get("/test");

      expect(response.status).toBe(200);

      // Verify counter was incremented
      const metrics = await register.metrics();
      expect(metrics).toContain("http_requests_total");
      expect(metrics).toMatch(/http_requests_total\{.*route="\/test".*\}\s+1/);
    });

    it("should increment counter exactly once per request", async () => {
      app.get("/test", (req, res) => {
        res.status(200).json({ message: "test" });
      });

      await request(app).get("/test");

      const metrics = await register.metrics();
      // Counter should be exactly 1
      expect(metrics).toMatch(/http_requests_total\{.*route="\/test".*\}\s+1/);
    });

    it("should increment counter for multiple requests", async () => {
      app.get("/test", (req, res) => {
        res.status(200).json({ message: "test" });
      });

      await request(app).get("/test");
      await request(app).get("/test");
      await request(app).get("/test");

      const metrics = await register.metrics();
      // Counter should be 3
      expect(metrics).toMatch(/http_requests_total\{.*route="\/test".*\}\s+3/);
    });
  });

  describe("Label Application", () => {
    it("should apply correct labels for GET method", async () => {
      const labelsSpy = vi.spyOn(httpRequestDuration, "labels");

      app.get("/test", (req, res) => {
        res.status(200).json({ message: "test" });
      });

      await request(app).get("/test");

      expect(labelsSpy).toHaveBeenCalledWith("GET", "/test", "200");
    });

    it("should apply correct labels for POST method", async () => {
      const labelsSpy = vi.spyOn(httpRequestDuration, "labels");

      app.post("/test", (req, res) => {
        res.status(201).json({ message: "created" });
      });

      await request(app).post("/test");

      expect(labelsSpy).toHaveBeenCalledWith("POST", "/test", "201");
    });

    it("should apply correct labels for different routes", async () => {
      const labelsSpy = vi.spyOn(httpRequestDuration, "labels");

      app.get("/api/users", (req, res) => {
        res.status(200).json({ users: [] });
      });

      await request(app).get("/api/users");

      expect(labelsSpy).toHaveBeenCalledWith("GET", "/api/users", "200");
    });

    it("should apply correct labels for 404 status code", async () => {
      const labelsSpy = vi.spyOn(httpRequestDuration, "labels");

      // No route defined, will return 404
      await request(app).get("/nonexistent");

      expect(labelsSpy).toHaveBeenCalled();
      const calls = labelsSpy.mock.calls as any[];
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0]).toBe("GET");
      expect(calls[0][2]).toBe("404");
    });

    it("should apply correct labels for 500 status code", async () => {
      const labelsSpy = vi.spyOn(httpRequestDuration, "labels");

      app.get("/error", (req, res) => {
        res.status(500).json({ error: "Internal Server Error" });
      });

      await request(app).get("/error");

      expect(labelsSpy).toHaveBeenCalledWith("GET", "/error", "500");
    });

    it("should handle different status codes correctly", async () => {
      const labelsSpy = vi.spyOn(httpRequestsTotal, "labels");

      app.get("/success", (req, res) => res.status(200).send("OK"));
      app.get("/created", (req, res) => res.status(201).send("Created"));
      app.get("/bad-request", (req, res) => res.status(400).send("Bad Request"));

      await request(app).get("/success");
      await request(app).get("/created");
      await request(app).get("/bad-request");

      expect(labelsSpy).toHaveBeenCalledWith("GET", "/success", "200");
      expect(labelsSpy).toHaveBeenCalledWith("GET", "/created", "201");
      expect(labelsSpy).toHaveBeenCalledWith("GET", "/bad-request", "400");
    });
  });

  describe("Different HTTP Methods", () => {
    it("should handle GET requests", async () => {
      const labelsSpy = vi.spyOn(httpRequestDuration, "labels");

      app.get("/test", (req, res) => {
        res.status(200).json({ method: "GET" });
      });

      await request(app).get("/test");

      expect(labelsSpy).toHaveBeenCalledWith("GET", "/test", "200");
    });

    it("should handle POST requests", async () => {
      const labelsSpy = vi.spyOn(httpRequestDuration, "labels");

      app.post("/test", (req, res) => {
        res.status(200).json({ method: "POST" });
      });

      await request(app).post("/test");

      expect(labelsSpy).toHaveBeenCalledWith("POST", "/test", "200");
    });

    it("should handle PUT requests", async () => {
      const labelsSpy = vi.spyOn(httpRequestDuration, "labels");

      app.put("/test", (req, res) => {
        res.status(200).json({ method: "PUT" });
      });

      await request(app).put("/test");

      expect(labelsSpy).toHaveBeenCalledWith("PUT", "/test", "200");
    });

    it("should handle DELETE requests", async () => {
      const labelsSpy = vi.spyOn(httpRequestDuration, "labels");

      app.delete("/test", (req, res) => {
        res.status(200).json({ method: "DELETE" });
      });

      await request(app).delete("/test");

      expect(labelsSpy).toHaveBeenCalledWith("DELETE", "/test", "200");
    });
  });
});
