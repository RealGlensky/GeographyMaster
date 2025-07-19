import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  currentStreak: integer("current_streak").default(0),
  totalStudyTime: integer("total_study_time").default(0), // in minutes
  excludedCountries: text("excluded_countries").array().default([]), // array of country codes to exclude from practice
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
  averageResponseTime: integer("average_response_time").default(0), // in milliseconds
  consistencyScore: integer("consistency_score").default(0), // 0-100, based on recent performance
  personalDifficultyRating: integer("personal_difficulty_rating").default(50), // 0-100, user's personal difficulty for this country
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

export const studyGoals = pgTable("study_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  period: text("period").notNull(), // 'daily', 'weekly', 'monthly'
  targetMinutes: integer("target_minutes").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// New table for dynamic difficulty recommendations
export const difficultyRecommendations = pgTable("difficulty_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  recommendedCountries: text("recommended_countries").array().default([]), // country codes
  difficultyLevel: text("difficulty_level").notNull(), // calculated dynamic difficulty
  confidenceScore: integer("confidence_score").default(0), // 0-100, how confident we are in this recommendation
  lastUpdated: timestamp("last_updated").defaultNow(),
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

export const insertStudyGoalsSchema = createInsertSchema(studyGoals).omit({
  id: true,
  createdAt: true,
});

export const insertDifficultyRecommendationsSchema = createInsertSchema(difficultyRecommendations).omit({
  id: true,
  lastUpdated: true,
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
export type StudyGoal = typeof studyGoals.$inferSelect;
export type InsertStudyGoal = z.infer<typeof insertStudyGoalsSchema>;
export type DifficultyRecommendation = typeof difficultyRecommendations.$inferSelect;
export type InsertDifficultyRecommendation = z.infer<typeof insertDifficultyRecommendationsSchema>;

// Additional types for frontend
export type Country = {
  code: string;
  name: string;
  capital: string;
  continent: string;
  difficulty: 'beginner' | 'easy' | 'intermediate' | 'advanced' | 'expert';
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
export type Difficulty = 'beginner' | 'easy' | 'intermediate' | 'advanced' | 'expert';
export type DynamicDifficultyLevel = 'adaptive' | 'review' | 'challenge' | 'mastery';

// Enhanced Country type for dynamic difficulty
export type CountryWithDynamicDifficulty = Country & {
  personalDifficultyRating?: number; // 0-100
  masteryLevel?: number; // 0-100
  recommendationReason?: string;
  isRecommended?: boolean;
};
