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

  const httpServer = createServer(app);
  return httpServer;
}
