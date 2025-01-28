import { pgTable, text, serial, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answers: jsonb("answers").$type<Record<string, string>>().notNull(),
  correct: jsonb("correct").$type<Record<string, boolean>>().notNull()
});

export const insertQuestionSchema = createInsertSchema(questions);
export const selectQuestionSchema = createSelectSchema(questions);
export type InsertQuestion = typeof questions.$inferInsert;
export type SelectQuestion = typeof questions.$inferSelect;
