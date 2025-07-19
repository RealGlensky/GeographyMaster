import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertQuizSessionSchema, insertUserProgressSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get current user (demo user with ID 1)
  app.get("/api/user", async (req, res) => {
    try {
      const user = await storage.getUser(1);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Get user statistics
  app.get("/api/user/stats", async (req, res) => {
    try {
      const stats = await storage.getUserStats(1);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user stats" });
    }
  });

  // Get user progress
  app.get("/api/user/progress", async (req, res) => {
    try {
      const progress = await storage.getUserProgress(1);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user progress" });
    }
  });

  // Get review items
  app.get("/api/user/review", async (req, res) => {
    try {
      const reviewItems = await storage.getReviewItems(1);
      res.json(reviewItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to get review items" });
    }
  });

  // Get user achievements
  app.get("/api/user/achievements", async (req, res) => {
    try {
      const achievements = await storage.getUserAchievements(1);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to get achievements" });
    }
  });

  // Get detailed mastery data for dashboard
  app.get("/api/user/mastery-details", async (req, res) => {
    try {
      const masteryDetails = await storage.getMasteryDetails(1);
      res.json(masteryDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to get mastery details" });
    }
  });

  // Get streak calendar data
  app.get("/api/user/streak-calendar", async (req, res) => {
    try {
      const monthKey = req.query.monthKey as string;
      const streakData = await storage.getStreakCalendar(1, monthKey);
      res.json(streakData);
    } catch (error) {
      res.status(500).json({ message: "Failed to get streak calendar" });
    }
  });

  // Get detailed accuracy data
  app.get("/api/user/accuracy-details", async (req, res) => {
    try {
      const { difficulty } = req.query;
      const accuracyDetails = await storage.getAccuracyDetails(1, difficulty as string);
      res.json(accuracyDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to get accuracy details" });
    }
  });

  // Get study time breakdown
  app.get("/api/user/study-time-breakdown", async (req, res) => {
    try {
      const { period } = req.query;
      const timePeriod = period as string || 'daily';
      const timeBreakdown = await storage.getStudyTimeBreakdown(1, timePeriod);
      res.json(timeBreakdown);
    } catch (error) {
      res.status(500).json({ message: "Failed to get study time breakdown" });
    }
  });

  // Update excluded countries
  app.patch("/api/user/excluded-countries", async (req, res) => {
    try {
      const { excludedCountries } = req.body;
      if (!Array.isArray(excludedCountries) || !excludedCountries.every(code => typeof code === 'string')) {
        return res.status(400).json({ message: "excludedCountries must be an array of strings" });
      }
      await storage.updateExcludedCountries(1, excludedCountries);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update excluded countries" });
    }
  });

  // Create quiz session
  app.post("/api/quiz/start", async (req, res) => {
    try {
      const data = insertQuizSessionSchema.parse({
        ...req.body,
        userId: 1,
      });
      const session = await storage.createQuizSession(data);
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create quiz session" });
    }
  });

  // Update quiz session
  app.patch("/api/quiz/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      await storage.updateQuizSession(sessionId, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update quiz session" });
    }
  });

  // Submit quiz answer
  app.post("/api/quiz/:sessionId/answer", async (req, res) => {
    try {
      const { countryCode, correct } = req.body;
      await storage.updateProgress(1, countryCode, correct);
      
      // Update daily stats
      const today = new Date().toISOString().split('T')[0];
      const currentStats = await storage.getDailyStats(1, today);
      
      await storage.updateDailyStats(1, today, {
        questionsAnswered: (currentStats?.questionsAnswered || 0) + 1,
        questionsCorrect: (currentStats?.questionsCorrect || 0) + (correct ? 1 : 0),
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit answer" });
    }
  });

  // Get daily stats
  app.get("/api/user/daily-stats", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stats = await storage.getDailyStats(1, today);
      res.json(stats || {
        countriesLearned: 3,
        questionsAnswered: 0,
        questionsCorrect: 0,
        studyTime: 0,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get daily stats" });
    }
  });

  // Study goals routes
  app.get("/api/user/study-goals", async (req, res) => {
    try {
      const goals = await storage.getUserStudyGoals(1);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to get study goals" });
    }
  });

  app.post("/api/user/study-goals", async (req, res) => {
    try {
      const { period, targetMinutes } = req.body;
      const goal = await storage.setStudyGoal({
        userId: 1,
        period,
        targetMinutes,
        isActive: true,
      });
      res.json(goal);
    } catch (error) {
      res.status(500).json({ message: "Failed to create study goal" });
    }
  });

  app.put("/api/user/study-goals/:goalId", async (req, res) => {
    try {
      const goalId = parseInt(req.params.goalId);
      const updates = req.body;
      await storage.updateStudyGoal(goalId, updates);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update study goal" });
    }
  });

  app.delete("/api/user/study-goals/:goalId", async (req, res) => {
    try {
      const goalId = parseInt(req.params.goalId);
      await storage.deleteStudyGoal(goalId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete study goal" });
    }
  });

  // Dynamic difficulty routes
  app.get("/api/user/recommended-countries", async (req, res) => {
    try {
      const difficultyLevel = (req.query.level || 'adaptive') as any;
      const count = parseInt(req.query.count as string) || 10;
      
      const recommendations = await storage.getRecommendedCountries(1, difficultyLevel, count);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ message: "Failed to get recommended countries" });
    }
  });

  app.post("/api/user/update-progress-metrics", async (req, res) => {
    try {
      const { countryCode, isCorrect, responseTime, updates } = req.body;
      
      if (updates) {
        await storage.updateProgressWithMetrics(1, countryCode, updates);
      } else {
        // Legacy fallback
        await storage.updateProgress(1, countryCode, isCorrect);
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update progress metrics" });
    }
  });

  app.get("/api/user/difficulty-recommendation", async (req, res) => {
    try {
      const recommendation = await storage.getDifficultyRecommendation(1);
      res.json(recommendation);
    } catch (error) {
      res.status(500).json({ message: "Failed to get difficulty recommendation" });
    }
  });

  app.post("/api/user/difficulty-recommendation", async (req, res) => {
    try {
      const recommendation = await storage.updateDifficultyRecommendation(1, req.body);
      res.json(recommendation);
    } catch (error) {
      res.status(500).json({ message: "Failed to update difficulty recommendation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
