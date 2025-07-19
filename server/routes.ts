import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertQuizSessionSchema, insertUserProgressSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Temporarily disable authentication for development
  // await setupAuth(app);

  // Demo user for development - create if doesn't exist
  const ensureDemoUser = async () => {
    const demoUserId = "demo-user-1";
    let user = await storage.getUser(demoUserId);
    if (!user) {
      user = await storage.upsertUser({
        id: demoUserId,
        email: "demo@example.com",
        firstName: "Demo",
        lastName: "User",
        profileImageUrl: null,
      });
    }
    return user;
  };

  // Auth routes - get current user (demo mode)
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      const user = await ensureDemoUser();
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get user statistics
  app.get("/api/user/stats", async (req: any, res) => {
    try {
      const userId = "demo-user-1";
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user stats" });
    }
  });

  // Get user progress
  app.get("/api/user/progress", async (req: any, res) => {
    try {
      const userId = "demo-user-1";
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user progress" });
    }
  });

  // Get review items
  app.get("/api/user/review", async (req: any, res) => {
    try {
      const userId = "demo-user-1";
      const reviewItems = await storage.getReviewItems(userId);
      res.json(reviewItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to get review items" });
    }
  });

  // Get user achievements
  app.get("/api/user/achievements", async (req: any, res) => {
    try {
      const userId = "demo-user-1";
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to get achievements" });
    }
  });

  // Get detailed mastery data for dashboard
  app.get("/api/user/mastery-details", async (req: any, res) => {
    try {
      const userId = "demo-user-1";
      const masteryDetails = await storage.getMasteryDetails(userId);
      res.json(masteryDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to get mastery details" });
    }
  });

  // Get streak calendar data
  app.get("/api/user/streak-calendar", async (req: any, res) => {
    try {
      const userId = "demo-user-1";
      const monthKey = req.query.monthKey as string;
      const streakData = await storage.getStreakCalendar(userId, monthKey);
      res.json(streakData);
    } catch (error) {
      res.status(500).json({ message: "Failed to get streak calendar" });
    }
  });

  // Get detailed accuracy data
  app.get("/api/user/accuracy-details", async (req: any, res) => {
    try {
      const userId = "demo-user-1";
      const accuracyDetails = await storage.getAccuracyDetails(userId);
      res.json(accuracyDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to get accuracy details" });
    }
  });

  // Get study time breakdown
  app.get("/api/user/study-time-breakdown", async (req: any, res) => {
    try {
      const userId = "demo-user-1";
      const { period } = req.query;
      const timePeriod = period as string || 'daily';
      const timeBreakdown = await storage.getStudyTimeBreakdown(userId, timePeriod);
      res.json(timeBreakdown);
    } catch (error) {
      res.status(500).json({ message: "Failed to get study time breakdown" });
    }
  });

  // Update excluded countries
  app.patch("/api/user/excluded-countries", async (req: any, res) => {
    try {
      const userId = "demo-user-1";
      const { excludedCountries } = req.body;
      if (!Array.isArray(excludedCountries) || !excludedCountries.every(code => typeof code === 'string')) {
        return res.status(400).json({ message: "excludedCountries must be an array of strings" });
      }
      await storage.updateExcludedCountries(userId, excludedCountries);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update excluded countries" });
    }
  });

  // Create quiz session
  app.post("/api/quiz/start", async (req: any, res) => {
    try {
      const userId = "demo-user-1";
      const data = insertQuizSessionSchema.parse({
        ...req.body,
        userId,
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
  app.patch("/api/quiz/:sessionId", async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      await storage.updateQuizSession(sessionId, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update quiz session" });
    }
  });

  // Submit quiz answer
  app.post("/api/quiz/:sessionId/answer", async (req: any, res) => {
    try {
      const userId = "demo-user-1";
      const { countryCode, correct } = req.body;
      await storage.updateProgress(userId, countryCode, correct);
      
      // Update daily stats
      const today = new Date().toISOString().split('T')[0];
      const currentStats = await storage.getDailyStats(userId, today);
      
      await storage.updateDailyStats(userId, today, {
        questionsAnswered: (currentStats?.questionsAnswered || 0) + 1,
        questionsCorrect: (currentStats?.questionsCorrect || 0) + (correct ? 1 : 0),
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit answer" });
    }
  });

  // Get daily stats
  app.get("/api/user/daily-stats", async (req: any, res) => {
    try {
      const userId = "demo-user-1";
      const today = new Date().toISOString().split('T')[0];
      const stats = await storage.getDailyStats(userId, today);
      res.json(stats || {
        countriesLearned: 0,
        questionsAnswered: 0,
        questionsCorrect: 0,
        studyTime: 0,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get daily stats" });
    }
  });

  // Study goals routes
  app.get("/api/user/study-goals", async (req: any, res) => {
    try {
      const userId = "demo-user-1";
      const goals = await storage.getUserStudyGoals(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to get study goals" });
    }
  });

  app.post("/api/user/study-goals", async (req: any, res) => {
    try {
      const userId = "demo-user-1";
      const { period, targetMinutes } = req.body;
      const goal = await storage.setStudyGoal({
        userId,
        period,
        targetMinutes,
        isActive: true,
      });
      res.json(goal);
    } catch (error) {
      res.status(500).json({ message: "Failed to create study goal" });
    }
  });

  app.put("/api/user/study-goals/:goalId", async (req: any, res) => {
    try {
      const goalId = parseInt(req.params.goalId);
      const updates = req.body;
      await storage.updateStudyGoal(goalId, updates);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update study goal" });
    }
  });

  app.delete("/api/user/study-goals/:goalId", async (req: any, res) => {
    try {
      const goalId = parseInt(req.params.goalId);
      await storage.deleteStudyGoal(goalId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete study goal" });
    }
  });

  // Dynamic difficulty routes
  app.get("/api/user/recommended-countries", async (req: any, res) => {
    try {
      const userId = "demo-user-1";
      const difficultyLevel = (req.query.level || 'adaptive') as any;
      const count = parseInt(req.query.count as string) || 10;
      
      const recommendations = await storage.getRecommendedCountries(userId, difficultyLevel, count);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ message: "Failed to get recommended countries" });
    }
  });

  app.post("/api/user/update-progress-metrics", async (req: any, res) => {
    try {
      const userId = "demo-user-1";
      const { countryCode, isCorrect, responseTime, updates } = req.body;
      
      if (updates) {
        await storage.updateProgressWithMetrics(userId, countryCode, updates);
      } else {
        // Legacy fallback
        await storage.updateProgress(userId, countryCode, isCorrect);
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update progress metrics" });
    }
  });

  app.get("/api/user/difficulty-recommendation", async (req: any, res) => {
    try {
      const userId = "demo-user-1";
      const recommendation = await storage.getDifficultyRecommendation(userId);
      res.json(recommendation);
    } catch (error) {
      res.status(500).json({ message: "Failed to get difficulty recommendation" });
    }
  });

  app.post("/api/user/difficulty-recommendation", async (req: any, res) => {
    try {
      const userId = "demo-user-1";
      const recommendation = await storage.updateDifficultyRecommendation(userId, req.body);
      res.json(recommendation);
    } catch (error) {
      res.status(500).json({ message: "Failed to update difficulty recommendation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}