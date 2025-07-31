import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertQuizSessionSchema, insertUserProgressSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import session from "express-session";

// Helper function to get authenticated user ID from session
function getAuthenticatedUserId(req: any): string {
  return req.session?.userId || "demo-user-1";
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Add session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'development-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }));

  // Temporarily disable Replit authentication for development
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

  // Auth routes - get current user
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Check if user is logged in via session
      if (req.session?.userId) {
        const user = await storage.getUser(req.session.userId);
        if (user) {
          return res.json(user);
        }
      }
      
      // For development: automatically return demo user
      const demoUser = await ensureDemoUser();
      req.session.userId = demoUser.id;
      return res.json(demoUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Registration endpoint
  app.post('/api/auth/register', async (req: any, res) => {
    try {
      const { username, email, password, firstName, lastName } = req.body;

      // Validate required fields
      if (!username || !email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Check if user already exists
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Create new user
      const newUser = await storage.createUser({
        username,
        email,
        password,
        firstName,
        lastName,
        profileImageUrl: null,
      });

      // Log in the user
      req.session.userId = newUser.id;

      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', async (req: any, res) => {
    try {
      const { usernameOrEmail, password } = req.body;

      if (!usernameOrEmail || !password) {
        return res.status(400).json({ message: "Username/email and password are required" });
      }

      // Find user by username or email
      const user = await storage.getUserByUsernameOrEmail(usernameOrEmail);
      if (!user) {
        return res.status(401).json({ message: "Invalid username/email or password" });
      }

      // Check password
      if (!user.password) {
        return res.status(401).json({ message: "Invalid username/email or password" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid username/email or password" });
      }

      // Log in the user
      req.session.userId = user.id;

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Get user statistics
  app.get("/api/user/stats", async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user stats" });
    }
  });

  // Get user progress
  app.get("/api/user/progress", async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user progress" });
    }
  });

  // Get review items
  app.get("/api/user/review", async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const reviewItems = await storage.getReviewItems(userId);
      res.json(reviewItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to get review items" });
    }
  });

  // Get user achievements
  app.get("/api/user/achievements", async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to get achievements" });
    }
  });

  // Get detailed mastery data for dashboard
  app.get("/api/user/mastery-details", async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const masteryDetails = await storage.getMasteryDetails(userId);
      res.json(masteryDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to get mastery details" });
    }
  });

  // Get streak calendar data
  app.get("/api/user/streak-calendar", async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
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
      const userId = getAuthenticatedUserId(req);
      const accuracyDetails = await storage.getAccuracyDetails(userId);
      res.json(accuracyDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to get accuracy details" });
    }
  });

  // Get study time breakdown
  app.get("/api/user/study-time-breakdown", async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
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
      const userId = getAuthenticatedUserId(req);
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
      const userId = getAuthenticatedUserId(req);
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
      const userId = getAuthenticatedUserId(req);
      const sessionId = parseInt(req.params.sessionId);
      const { questionId, answer, responseTime, countryCode: cc, correct } = req.body;
      
      // For now, determine if this is a map challenge by checking answer format
      const isMapChallenge = answer && answer.includes("|");
      
      let isCorrect = false;
      let countryCode = "";
      
      if (isMapChallenge) {
        // Use the country code and correctness from the frontend
        countryCode = cc || "";
        isCorrect = correct || false;
      } else {
        // Handle other quiz modes
        countryCode = cc || "";
        isCorrect = correct || false;
      }
      
      // Update progress
      if (countryCode) {
        await storage.updateProgress(userId, countryCode, isCorrect);
      }
      
      // Update daily stats
      const today = new Date().toISOString().split('T')[0];
      const currentStats = await storage.getDailyStats(userId, today);
      
      await storage.updateDailyStats(userId, today, {
        questionsAnswered: (currentStats?.questionsAnswered || 0) + 1,
        questionsCorrect: (currentStats?.questionsCorrect || 0) + (isCorrect ? 1 : 0),
      });
      
      res.json({ success: true, isCorrect });
    } catch (error) {
      console.error("Quiz answer submission error:", error);
      res.status(500).json({ message: "Failed to submit answer" });
    }
  });

  // Get daily stats
  app.get("/api/user/daily-stats", async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
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
      const userId = getAuthenticatedUserId(req);
      const goals = await storage.getUserStudyGoals(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to get study goals" });
    }
  });

  app.post("/api/user/study-goals", async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
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
      const userId = getAuthenticatedUserId(req);
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
      const userId = getAuthenticatedUserId(req);
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
      const userId = getAuthenticatedUserId(req);
      const recommendation = await storage.getDifficultyRecommendation(userId);
      res.json(recommendation);
    } catch (error) {
      res.status(500).json({ message: "Failed to get difficulty recommendation" });
    }
  });

  app.post("/api/user/difficulty-recommendation", async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const recommendation = await storage.updateDifficultyRecommendation(userId, req.body);
      res.json(recommendation);
    } catch (error) {
      res.status(500).json({ message: "Failed to update difficulty recommendation" });
    }
  });

  // Logout route
  app.get("/api/logout", async (req: any, res) => {
    if (req.session) {
      req.session.destroy((err: any) => {
        if (err) {
          console.error("Error destroying session:", err);
        }
        res.clearCookie('connect.sid'); // Clear session cookie
        res.redirect("/");
      });
    } else {
      res.redirect("/");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}