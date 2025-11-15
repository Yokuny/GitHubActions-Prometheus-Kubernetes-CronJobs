import type { Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/index.js";

describe("Routes Integration Tests", () => {
  let app: Express;

  beforeAll(() => {
    // Create Express app instance for testing
    app = createApp();
  });

  describe("GET /fast", () => {
    it("should return 200 status code", async () => {
      const response = await request(app).get("/fast");
      expect(response.status).toBe(200);
    });

    it("should respond within 500ms", async () => {
      const startTime = Date.now();
      const response = await request(app).get("/fast");
      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(600); // 500ms + 100ms buffer for test overhead
    });

    it("should return correct JSON structure", async () => {
      const response = await request(app).get("/fast");

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("latency");
      expect(response.body.message).toBe("Fast response");
      expect(typeof response.body.latency).toBe("number");
    });

    it("should return ISO 8601 timestamp", async () => {
      const response = await request(app).get("/fast");

      // Validate ISO 8601 format
      const timestamp = response.body.timestamp;
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      // Ensure it's a valid date
      const date = new Date(timestamp);
      expect(date.toString()).not.toBe("Invalid Date");
    });
  });

  describe("GET /slow", () => {
    it("should return 200 status code", async () => {
      const response = await request(app).get("/slow");
      expect(response.status).toBe(200);
    });

    it("should respond within 1000ms", async () => {
      const startTime = Date.now();
      const response = await request(app).get("/slow");
      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(1100); // 1000ms + 100ms buffer for test overhead
    });

    it("should return correct JSON structure", async () => {
      const response = await request(app).get("/slow");

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("latency");
      expect(response.body.message).toBe("Slow response");
      expect(typeof response.body.latency).toBe("number");
    });

    it("should return ISO 8601 timestamp", async () => {
      const response = await request(app).get("/slow");

      // Validate ISO 8601 format
      const timestamp = response.body.timestamp;
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      // Ensure it's a valid date
      const date = new Date(timestamp);
      expect(date.toString()).not.toBe("Invalid Date");
    });
  });

  describe("GET /metrics", () => {
    it("should return 200 status code", async () => {
      const response = await request(app).get("/metrics");
      expect(response.status).toBe(200);
    });

    it("should return valid Prometheus format", async () => {
      const response = await request(app).get("/metrics");

      // Check Content-Type header
      expect(response.headers["content-type"]).toContain("text/plain");

      // Check response is text
      expect(typeof response.text).toBe("string");
      expect(response.text.length).toBeGreaterThan(0);
    });

    it("should contain expected Prometheus metrics", async () => {
      const response = await request(app).get("/metrics");
      const metricsText = response.text;

      // Check for histogram metric
      expect(metricsText).toContain("http_request_duration_seconds");

      // Check for counter metric
      expect(metricsText).toContain("http_requests_total");

      // Check for Node.js default metrics
      expect(metricsText).toContain("nodejs_");
    });

    it("should contain HELP and TYPE declarations", async () => {
      const response = await request(app).get("/metrics");
      const metricsText = response.text;

      // Prometheus format requires HELP and TYPE declarations
      expect(metricsText).toContain("# HELP");
      expect(metricsText).toContain("# TYPE");
    });
  });

  describe("GET /health", () => {
    it("should return 200 status code", async () => {
      const response = await request(app).get("/health");
      expect(response.status).toBe(200);
    });

    it("should return correct JSON structure", async () => {
      const response = await request(app).get("/health");

      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");

      expect(response.body.status).toBe("healthy");
      expect(typeof response.body.uptime).toBe("number");
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });

    it("should return ISO 8601 timestamp", async () => {
      const response = await request(app).get("/health");

      // Validate ISO 8601 format
      const timestamp = response.body.timestamp;
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      // Ensure it's a valid date
      const date = new Date(timestamp);
      expect(date.toString()).not.toBe("Invalid Date");
    });

    it("should respond quickly", async () => {
      const startTime = Date.now();
      const response = await request(app).get("/health");
      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(100); // Health check should be very fast
    });
  });
});
