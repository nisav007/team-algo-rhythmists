import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const fallEventsTable = pgTable("fall_events", {
  id: serial("id").primaryKey(),
  location: text("location"),
  notes: text("notes"),
  smsStatus: text("sms_status").notNull().default("pending"),
  smsSentCount: integer("sms_sent_count").notNull().default(0),
  detectedAt: timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFallEventSchema = createInsertSchema(fallEventsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertFallEvent = z.infer<typeof insertFallEventSchema>;
export type FallEvent = typeof fallEventsTable.$inferSelect;
