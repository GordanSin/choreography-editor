import { db } from "./db";
import {
  projects,
  markers,
  type Project,
  type InsertProject,
  type UpdateProject,
  type Marker,
  type InsertMarker,
  type UpdateMarker,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Projects
  getProject(id: string): Promise<Project | undefined>;
  listProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: UpdateProject): Promise<Project>;
  deleteProject(id: string): Promise<void>;

  // Markers
  getMarker(id: string): Promise<Marker | undefined>;
  getProjectMarkers(projectId: string): Promise<Marker[]>;
  createMarker(marker: InsertMarker): Promise<Marker>;
  updateMarker(id: string, marker: UpdateMarker): Promise<Marker>;
  deleteMarker(id: string): Promise<void>;
  deleteProjectMarkers(projectId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getProject(id: string): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id));
    return result[0];
  }

  async listProjects(): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt));
  }

  async createProject(project: InsertProject): Promise<Project> {
    const result = await db
      .insert(projects)
      .values(project)
      .returning();
    return result[0];
  }

  async updateProject(id: string, project: UpdateProject): Promise<Project> {
    const result = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date().toISOString() })
      .where(eq(projects.id, id))
      .returning();
    return result[0];
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async getMarker(id: string): Promise<Marker | undefined> {
    const result = await db.select().from(markers).where(eq(markers.id, id));
    return result[0];
  }

  async getProjectMarkers(projectId: string): Promise<Marker[]> {
    return await db
      .select()
      .from(markers)
      .where(eq(markers.projectId, projectId));
  }

  async createMarker(marker: InsertMarker): Promise<Marker> {
    const result = await db.insert(markers).values(marker).returning();
    return result[0];
  }

  async updateMarker(id: string, marker: UpdateMarker): Promise<Marker> {
    const result = await db
      .update(markers)
      .set(marker)
      .where(eq(markers.id, id))
      .returning();
    return result[0];
  }

  async deleteMarker(id: string): Promise<void> {
    await db.delete(markers).where(eq(markers.id, id));
  }

  async deleteProjectMarkers(projectId: string): Promise<void> {
    await db.delete(markers).where(eq(markers.projectId, projectId));
  }
}

export const storage = new DatabaseStorage();
