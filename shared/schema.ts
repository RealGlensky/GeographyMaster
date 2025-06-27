import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  currentStreak: integer("current_streak").default(0),
  totalStudyTime: integer("total_study_time").default(0), // in minutes
  createdAt: timestamp("created_at").defaultNow(),
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  countryCode: text("country_code").notNull(),
  masteryLevel: integer("mastery_level").default(0), // 0-100
  correctAnswers: integer("correct_answers").default(0),
  totalAttempts: integer("total_attempts").default(0),
  lastReviewed: timestamp("last_reviewed"),
  needsReview: boolean("needs_review").default(false),
});

export const quizSessions = pgTable("quiz_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  mode: text("mode").notNull(), // 'quiz', 'flashcards', 'typing', 'map'
  difficulty: text("difficulty").notNull(), // 'beginner', 'intermediate', 'expert'
  questionsAsked: integer("questions_asked").default(0),
  questionsCorrect: integer("questions_correct").default(0),
  timeSpent: integer("time_spent").default(0), // in seconds
  completed: boolean("completed").default(false),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'streak', 'mastery', 'speed', etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
});

export const dailyStats = pgTable("daily_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  countriesLearned: integer("countries_learned").default(0),
  questionsAnswered: integer("questions_answered").default(0),
  questionsCorrect: integer("questions_correct").default(0),
  studyTime: integer("study_time").default(0), // in minutes
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
});

export const insertQuizSessionSchema = createInsertSchema(quizSessions).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  earnedAt: true,
});

export const insertDailyStatsSchema = createInsertSchema(dailyStats).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type QuizSession = typeof quizSessions.$inferSelect;
export type InsertQuizSession = z.infer<typeof insertQuizSessionSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type DailyStats = typeof dailyStats.$inferSelect;
export type InsertDailyStats = z.infer<typeof insertDailyStatsSchema>;

// Additional types for frontend
export type Country = {
  code: string;
  name: string;
  capital: string;
  continent: string;
  difficulty: 'beginner' | 'intermediate' | 'expert';
};

export type QuizQuestion = {
  id: string;
  type: 'country-to-capital' | 'capital-to-country';
  country: string;
  capital: string;
  options: string[];
  correctAnswer: string;
};

export type StudyMode = 'quiz' | 'flashcards' | 'typing' | 'map';
export type Difficulty = 'beginner' | 'intermediate' | 'expert';
