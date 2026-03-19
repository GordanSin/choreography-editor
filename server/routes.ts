import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import {
  insertProjectSchema,
  updateProjectSchema,
  insertMarkerSchema,
  updateMarkerSchema,
} from "@shared/schema";
import { ZodError } from "zod";

function formatZodError(error: ZodError): string {
  return error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Projects
  app.get("/api/projects", async (_req, res) => {
    try {
      const allProjects = await storage.listProjects();
      res.json(allProjects);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Failed to fetch project:", error);
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validated = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validated);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: formatZodError(error) });
      }
      console.error("Failed to create project:", error);
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const validated = updateProjectSchema.parse(req.body);
      const project = await storage.updateProject(req.params.id, validated);
      res.json(project);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: formatZodError(error) });
      }
      console.error("Failed to update project:", error);
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      await storage.deleteProject(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete project:", error);
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // Markers
  app.get("/api/projects/:projectId/markers", async (req, res) => {
    try {
      const markerList = await storage.getProjectMarkers(req.params.projectId);
      res.json(markerList);
    } catch (error) {
      console.error("Failed to fetch markers:", error);
      res.status(500).json({ error: "Failed to fetch markers" });
    }
  });

  app.post("/api/markers", async (req, res) => {
    try {
      const validated = insertMarkerSchema.parse(req.body);
      const marker = await storage.createMarker(validated);
      res.status(201).json(marker);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: formatZodError(error) });
      }
      console.error("Failed to create marker:", error);
      res.status(500).json({ error: "Failed to create marker" });
    }
  });

  app.patch("/api/markers/:id", async (req, res) => {
    try {
      const validated = updateMarkerSchema.parse(req.body);
      const marker = await storage.updateMarker(req.params.id, validated);
      res.json(marker);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: formatZodError(error) });
      }
      console.error("Failed to update marker:", error);
      res.status(500).json({ error: "Failed to update marker" });
    }
  });

  app.delete("/api/markers/:id", async (req, res) => {
    try {
      await storage.deleteMarker(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete marker:", error);
      res.status(500).json({ error: "Failed to delete marker" });
    }
  });

  return httpServer;
}
