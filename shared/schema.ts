import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  audioFileName: text("audio_file_name").notNull(),
  duration: numeric("duration").notNull(), // in seconds
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const markers = pgTable("markers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  time: numeric("time").notNull(), // in seconds
  duration: numeric("duration").notNull(), // in seconds
  channel: text("channel").notNull(), // G1, G2, G3, G4
  intensity: integer("intensity").notNull(), // 0-100
  pattern: text("pattern").notNull(), // steady, staccato, heartbeat
});

// Schemas for validation
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMarkerSchema = createInsertSchema(markers).omit({
  id: true,
});

export const updateProjectSchema = insertProjectSchema.partial();
export const updateMarkerSchema = insertMarkerSchema.partial();

// Types
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;

export type Marker = typeof markers.$inferSelect;
export type InsertMarker = z.infer<typeof insertMarkerSchema>;
export type UpdateMarker = z.infer<typeof updateMarkerSchema>;
