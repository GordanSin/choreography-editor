import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const channelEnum = pgEnum("channel", ["G1", "G2", "G3", "G4"]);
export const patternEnum = pgEnum("pattern", ["steady", "staccato", "heartbeat"]);

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  audioFileName: text("audio_file_name").notNull(),
  duration: real("duration").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const markers = pgTable("markers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  time: real("time").notNull(),
  duration: real("duration").notNull(),
  channel: channelEnum("channel").notNull(),
  intensity: integer("intensity").notNull(),
  pattern: patternEnum("pattern").notNull(),
});

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

export type ChannelId = "G1" | "G2" | "G3" | "G4";
export type PatternType = "steady" | "staccato" | "heartbeat";

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;

export type Marker = typeof markers.$inferSelect;
export type InsertMarker = z.infer<typeof insertMarkerSchema>;
export type UpdateMarker = z.infer<typeof updateMarkerSchema>;
