import {
  type Project,
  type InsertProject,
  type UpdateProject,
  type Marker,
  type InsertMarker,
  type UpdateMarker,
} from "@shared/schema";

export interface IStorage {
  getProject(id: string): Promise<Project | undefined>;
  listProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: UpdateProject): Promise<Project>;
  deleteProject(id: string): Promise<void>;

  getMarker(id: string): Promise<Marker | undefined>;
  getProjectMarkers(projectId: string): Promise<Marker[]>;
  createMarker(marker: InsertMarker): Promise<Marker>;
  updateMarker(id: string, marker: UpdateMarker): Promise<Marker>;
  deleteMarker(id: string): Promise<void>;
  deleteProjectMarkers(projectId: string): Promise<void>;
}

function generateId(): string {
  return crypto.randomUUID();
}

export class MemoryStorage implements IStorage {
  private projects: Map<string, Project> = new Map();
  private markers: Map<string, Marker> = new Map();

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async listProjects(): Promise<Project[]> {
    return Array.from(this.projects.values()).sort(
      (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async createProject(project: InsertProject): Promise<Project> {
    const id = generateId();
    const now = new Date();
    const created: Project = {
      id,
      title: project.title,
      audioFileName: project.audioFileName,
      duration: project.duration,
      createdAt: now,
      updatedAt: now,
    };
    this.projects.set(id, created);
    return created;
  }

  async updateProject(id: string, project: UpdateProject): Promise<Project> {
    const existing = this.projects.get(id);
    if (!existing) throw new Error("Project not found");
    const updated: Project = { ...existing, ...project, updatedAt: new Date() };
    this.projects.set(id, updated);
    return updated;
  }

  async deleteProject(id: string): Promise<void> {
    this.projects.delete(id);
    // Cascade delete markers
    Array.from(this.markers.entries()).forEach(([markerId, marker]) => {
      if (marker.projectId === id) this.markers.delete(markerId);
    });
  }

  async getMarker(id: string): Promise<Marker | undefined> {
    return this.markers.get(id);
  }

  async getProjectMarkers(projectId: string): Promise<Marker[]> {
    return Array.from(this.markers.values()).filter((m) => m.projectId === projectId);
  }

  async createMarker(marker: InsertMarker): Promise<Marker> {
    const id = generateId();
    const created: Marker = {
      id,
      projectId: marker.projectId,
      time: marker.time,
      duration: marker.duration,
      channel: marker.channel,
      intensity: marker.intensity,
      pattern: marker.pattern,
    };
    this.markers.set(id, created);
    return created;
  }

  async updateMarker(id: string, marker: UpdateMarker): Promise<Marker> {
    const existing = this.markers.get(id);
    if (!existing) throw new Error("Marker not found");
    const updated: Marker = { ...existing, ...marker };
    this.markers.set(id, updated);
    return updated;
  }

  async deleteMarker(id: string): Promise<void> {
    this.markers.delete(id);
  }

  async deleteProjectMarkers(projectId: string): Promise<void> {
    Array.from(this.markers.entries()).forEach(([id, marker]) => {
      if (marker.projectId === projectId) this.markers.delete(id);
    });
  }
}

export class DatabaseStorage implements IStorage {
  private db: ReturnType<typeof import("drizzle-orm/node-postgres").drizzle> | null = null;
  private projectsTable: typeof import("@shared/schema").projects | null = null;
  private markersTable: typeof import("@shared/schema").markers | null = null;

  async init() {
    const { db } = await import("./db");
    const schema = await import("@shared/schema");
    this.db = db;
    this.projectsTable = schema.projects;
    this.markersTable = schema.markers;
  }

  private get database() {
    if (!this.db) throw new Error("Database not initialized");
    return this.db;
  }

  async getProject(id: string): Promise<Project | undefined> {
    const { eq } = await import("drizzle-orm");
    const result = await this.database.select().from(this.projectsTable!).where(eq(this.projectsTable!.id, id));
    return result[0];
  }

  async listProjects(): Promise<Project[]> {
    const { desc } = await import("drizzle-orm");
    return await this.database.select().from(this.projectsTable!).orderBy(desc(this.projectsTable!.createdAt));
  }

  async createProject(project: InsertProject): Promise<Project> {
    const result = await this.database.insert(this.projectsTable!).values(project).returning();
    return result[0];
  }

  async updateProject(id: string, project: UpdateProject): Promise<Project> {
    const { eq } = await import("drizzle-orm");
    const result = await this.database
      .update(this.projectsTable!)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(this.projectsTable!.id, id))
      .returning();
    if (!result[0]) throw new Error("Project not found");
    return result[0];
  }

  async deleteProject(id: string): Promise<void> {
    const { eq } = await import("drizzle-orm");
    await this.database.delete(this.projectsTable!).where(eq(this.projectsTable!.id, id));
  }

  async getMarker(id: string): Promise<Marker | undefined> {
    const { eq } = await import("drizzle-orm");
    const result = await this.database.select().from(this.markersTable!).where(eq(this.markersTable!.id, id));
    return result[0];
  }

  async getProjectMarkers(projectId: string): Promise<Marker[]> {
    const { eq } = await import("drizzle-orm");
    return await this.database.select().from(this.markersTable!).where(eq(this.markersTable!.projectId, projectId));
  }

  async createMarker(marker: InsertMarker): Promise<Marker> {
    const result = await this.database.insert(this.markersTable!).values(marker).returning();
    return result[0];
  }

  async updateMarker(id: string, marker: UpdateMarker): Promise<Marker> {
    const { eq } = await import("drizzle-orm");
    const result = await this.database
      .update(this.markersTable!)
      .set(marker)
      .where(eq(this.markersTable!.id, id))
      .returning();
    if (!result[0]) throw new Error("Marker not found");
    return result[0];
  }

  async deleteMarker(id: string): Promise<void> {
    const { eq } = await import("drizzle-orm");
    await this.database.delete(this.markersTable!).where(eq(this.markersTable!.id, id));
  }

  async deleteProjectMarkers(projectId: string): Promise<void> {
    const { eq } = await import("drizzle-orm");
    await this.database.delete(this.markersTable!).where(eq(this.markersTable!.projectId, projectId));
  }
}

async function createStorage(): Promise<IStorage> {
  if (process.env.DATABASE_URL) {
    console.log("Using PostgreSQL storage");
    const dbStorage = new DatabaseStorage();
    await dbStorage.init();
    return dbStorage;
  }
  console.log("No DATABASE_URL found — using in-memory storage");
  return new MemoryStorage();
}

export const storagePromise = createStorage();
export let storage: IStorage;
storagePromise.then((s) => { storage = s; });
