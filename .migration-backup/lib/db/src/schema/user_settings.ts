import { pgTable, text, boolean, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userSettingsTable = pgTable("user_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),
  persona: text("persona").notNull().default("friend"),
  language: text("language").notNull().default("auto"),
  responseStyle: text("response_style").notNull().default("friendly"),
  responseLength: text("response_length").notNull().default("balanced"),
  animationSpeed: text("animation_speed").notNull().default("normal"),
  demoMode: boolean("demo_mode").notNull().default(false),
  adultMode: boolean("adult_mode").notNull().default(false),
  soundEnabled: boolean("sound_enabled").notNull().default(true),
  voiceEnabled: boolean("voice_enabled").notNull().default(true),
  permissions: jsonb("permissions").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSettingsSchema = createInsertSchema(userSettingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettingsTable.$inferSelect;
