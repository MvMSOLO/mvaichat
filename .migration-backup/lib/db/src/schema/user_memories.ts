import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userMemoriesTable = pgTable("user_memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  weight: integer("weight").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserMemorySchema = createInsertSchema(userMemoriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUserMemory = z.infer<typeof insertUserMemorySchema>;
export type UserMemory = typeof userMemoriesTable.$inferSelect;
