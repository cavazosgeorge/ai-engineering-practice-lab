import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// Lessons - top-level topic containers
export const lessons = sqliteTable("lessons", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  orderIndex: integer("order_index").notNull().default(0),
  isPublished: integer("is_published", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Concepts - sub-topics within lessons
export const concepts = sqliteTable("concepts", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  explanation: text("explanation"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Challenges - practice problems
export const challenges = sqliteTable("challenges", {
  id: text("id").primaryKey(),
  conceptId: text("concept_id").notNull().references(() => concepts.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["implement", "explain", "compare", "multiple_choice"] }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  starterCode: text("starter_code"),
  solutionCode: text("solution_code"),
  hints: text("hints", { mode: "json" }).$type<string[]>(),
  difficulty: text("difficulty", { enum: ["beginner", "intermediate", "advanced"] }).notNull().default("beginner"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Test cases for challenges
export const testCases = sqliteTable("test_cases", {
  id: text("id").primaryKey(),
  challengeId: text("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  input: text("input", { mode: "json" }).notNull(),
  expectedOutput: text("expected_output", { mode: "json" }).notNull(),
  description: text("description"),
  isHidden: integer("is_hidden", { mode: "boolean" }).notNull().default(false),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// User progress with SM-2 spaced repetition
export const userProgress = sqliteTable("user_progress", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  challengeId: text("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  repetitions: integer("repetitions").notNull().default(0),
  easeFactor: real("ease_factor").notNull().default(2.5),
  interval: integer("interval").notNull().default(0),
  nextReviewDate: integer("next_review_date", { mode: "timestamp" }),
  lastReviewDate: integer("last_review_date", { mode: "timestamp" }),
  lastQuality: integer("last_quality"),
  masteryLevel: text("mastery_level", { enum: ["learning", "reviewing", "mastered"] }).notNull().default("learning"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Submissions - audit trail
export const submissions = sqliteTable("submissions", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  challengeId: text("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  passed: integer("passed", { mode: "boolean" }).notNull(),
  testResults: text("test_results", { mode: "json" }).$type<{ testId: string; passed: boolean; actual?: unknown; error?: string }[]>(),
  executionTimeMs: integer("execution_time_ms"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Relations
export const lessonsRelations = relations(lessons, ({ many }) => ({
  concepts: many(concepts),
}));

export const conceptsRelations = relations(concepts, ({ one, many }) => ({
  lesson: one(lessons, { fields: [concepts.lessonId], references: [lessons.id] }),
  challenges: many(challenges),
}));

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  concept: one(concepts, { fields: [challenges.conceptId], references: [concepts.id] }),
  testCases: many(testCases),
  progress: many(userProgress),
  submissions: many(submissions),
}));

export const testCasesRelations = relations(testCases, ({ one }) => ({
  challenge: one(challenges, { fields: [testCases.challengeId], references: [challenges.id] }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  challenge: one(challenges, { fields: [userProgress.challengeId], references: [challenges.id] }),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  challenge: one(challenges, { fields: [submissions.challengeId], references: [challenges.id] }),
}));

// Type exports
export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;
export type Concept = typeof concepts.$inferSelect;
export type NewConcept = typeof concepts.$inferInsert;
export type Challenge = typeof challenges.$inferSelect;
export type NewChallenge = typeof challenges.$inferInsert;
export type TestCase = typeof testCases.$inferSelect;
export type NewTestCase = typeof testCases.$inferInsert;
export type UserProgress = typeof userProgress.$inferSelect;
export type NewUserProgress = typeof userProgress.$inferInsert;
export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
