import { 
  users, userProgress, quizSessions, achievements, dailyStats, studyGoals, difficultyRecommendations,
  type User, type InsertUser, type UpsertUser, type UserProgress, type InsertUserProgress,
  type QuizSession, type InsertQuizSession, type Achievement, type InsertAchievement,
  type DailyStats, type InsertDailyStats, type StudyGoal, type InsertStudyGoal,
  type DifficultyRecommendation, type InsertDifficultyRecommendation,
  type StudyMode, type Difficulty, type DynamicDifficultyLevel, type CountryWithDynamicDifficulty
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, or } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User methods (for authentication)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStreak(userId: string, streak: number): Promise<void>;
  updateStudyTime(userId: string, minutes: number): Promise<void>;
  updateExcludedCountries(userId: string, excludedCountries: string[]): Promise<void>;
  updateUserProfile(userId: string, updates: { firstName: string; lastName: string; email: string }): Promise<User>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;

  // Progress methods
  getUserProgress(userId: string): Promise<UserProgress[]>;
  getProgressByCountry(userId: string, countryCode: string): Promise<UserProgress | undefined>;
  updateProgress(userId: string, countryCode: string, correct: boolean): Promise<void>;
  updateProgressWithMetrics(userId: string, countryCode: string, updates: Partial<UserProgress>): Promise<void>;
  getReviewItems(userId: string): Promise<UserProgress[]>;
  
  // Quiz session methods
  createQuizSession(session: InsertQuizSession): Promise<QuizSession>;
  updateQuizSession(sessionId: number, updates: Partial<QuizSession>): Promise<void>;
  getUserQuizSessions(userId: string): Promise<QuizSession[]>;
  
  // Achievement methods
  getUserAchievements(userId: string): Promise<Achievement[]>;
  addAchievement(achievement: InsertAchievement): Promise<Achievement>;
  
  // Daily stats methods
  getDailyStats(userId: string, date: string): Promise<DailyStats | undefined>;
  updateDailyStats(userId: string, date: string, updates: Partial<InsertDailyStats>): Promise<void>;
  getUserStats(userId: string): Promise<{
    totalCountriesMastered: number;
    accuracyRate: number;
    totalStudyTime: number;
    currentStreak: number;
  }>;

  // Detailed analytics methods
  getMasteryDetails(userId: string): Promise<{
    masteredCountries: Array<{countryCode: string; masteryLevel: number; correctAnswers: number; totalAttempts: number}>;
    unmasteredCountries: Array<{countryCode: string; masteryLevel: number; correctAnswers: number; totalAttempts: number}>;
  }>;
  
  getStreakCalendar(userId: string, monthKey?: string): Promise<Array<{date: string; hasActivity: boolean; studyTime: number; questionsAnswered: number}>>;
  
  getAccuracyDetails(userId: string): Promise<{
    byDifficulty: Array<{difficulty: string; accuracy: number; totalQuestions: number}>;
    byStudyMode: Array<{mode: string; accuracy: number; totalQuestions: number}>;
    worstCountries: Array<{countryCode: string; accuracy: number; totalAttempts: number}>;
  }>;
  
  getStudyTimeBreakdown(userId: string, period: string): Promise<Array<{period: string; studyTime: number; sessionsCount: number}>>;
  
  // Study goals methods
  getUserStudyGoals(userId: string): Promise<StudyGoal[]>;
  setStudyGoal(goal: InsertStudyGoal): Promise<StudyGoal>;
  updateStudyGoal(goalId: number, updates: Partial<StudyGoal>): Promise<void>;
  deleteStudyGoal(goalId: number): Promise<void>;
  
  // Dynamic difficulty methods
  getRecommendedCountries(userId: string, difficultyLevel: DynamicDifficultyLevel, count?: number): Promise<CountryWithDynamicDifficulty[]>;
  updateDifficultyRecommendation(userId: string, recommendation: InsertDifficultyRecommendation): Promise<DifficultyRecommendation>;
  getDifficultyRecommendation(userId: string): Promise<DifficultyRecommendation | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User methods (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      or(eq(users.username, usernameOrEmail), eq(users.email, usernameOrEmail))
    );
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash password if provided
    const userData = { ...insertUser };
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 12);
    }

    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Simple ID generation
      })
      .returning();
    return user;
  }

  async updateUserStreak(userId: string, streak: number): Promise<void> {
    await db
      .update(users)
      .set({ currentStreak: streak })
      .where(eq(users.id, userId));
  }

  async updateStudyTime(userId: string, minutes: number): Promise<void> {
    await db
      .update(users)
      .set({ 
        totalStudyTime: sql`${users.totalStudyTime} + ${minutes}`
      })
      .where(eq(users.id, userId));
  }

  async updateExcludedCountries(userId: string, excludedCountries: string[]): Promise<void> {
    await db
      .update(users)
      .set({ excludedCountries })
      .where(eq(users.id, userId));
  }

  async updateUserProfile(userId: string, updates: { firstName: string; lastName: string; email: string }): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        firstName: updates.firstName,
        lastName: updates.lastName,
        email: updates.email,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  // Progress methods
  async getUserProgress(userId: string): Promise<UserProgress[]> {
    return await db.select().from(userProgress).where(eq(userProgress.userId, userId));
  }

  async getProgressByCountry(userId: string, countryCode: string): Promise<UserProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.countryCode, countryCode)));
    return progress;
  }

  async updateProgress(userId: string, countryCode: string, correct: boolean): Promise<void> {
    const existing = await this.getProgressByCountry(userId, countryCode);
    
    if (!existing) {
      await db.insert(userProgress).values({
        userId,
        countryCode,
        masteryLevel: correct ? 25 : 10,
        correctAnswers: correct ? 1 : 0,
        totalAttempts: 1,
        lastReviewed: new Date(),
        needsReview: !correct,
        averageResponseTime: 3000,
        consistencyScore: correct ? 60 : 30,
        personalDifficultyRating: 50
      });
    } else {
      const newTotalAttempts = (existing.totalAttempts || 0) + 1;
      const newCorrectAnswers = (existing.correctAnswers || 0) + (correct ? 1 : 0);
      const accuracyRate = newCorrectAnswers / newTotalAttempts;
      
      // Enhanced mastery calculation
      let baseMastery = Math.round(accuracyRate * 70);
      
      // Consistency bonus for multiple attempts
      if (newTotalAttempts >= 3) {
        if (accuracyRate >= 0.8) baseMastery += 20;
        else if (accuracyRate >= 0.6) baseMastery += 15;
        else if (accuracyRate >= 0.5) baseMastery += 10;
      }
      
      // Recent performance bonus
      if (accuracyRate >= 0.8) baseMastery += 10;
      else if (accuracyRate >= 0.6) baseMastery += 5;
      
      const newMasteryLevel = Math.max(0, Math.min(100, baseMastery));
      
      await db
        .update(userProgress)
        .set({
          totalAttempts: newTotalAttempts,
          correctAnswers: newCorrectAnswers,
          masteryLevel: newMasteryLevel,
          needsReview: newMasteryLevel < 70 || accuracyRate < 0.6,
          lastReviewed: new Date(),
        })
        .where(and(eq(userProgress.userId, userId), eq(userProgress.countryCode, countryCode)));
    }
  }

  async updateProgressWithMetrics(userId: string, countryCode: string, updates: Partial<UserProgress>): Promise<void> {
    const existing = await this.getProgressByCountry(userId, countryCode);
    
    if (!existing) {
      await db.insert(userProgress).values({
        userId,
        countryCode,
        masteryLevel: 0,
        correctAnswers: 0,
        totalAttempts: 0,
        lastReviewed: new Date(),
        needsReview: false,
        averageResponseTime: 0,
        consistencyScore: 50,
        personalDifficultyRating: 50,
        ...updates
      });
    } else {
      await db
        .update(userProgress)
        .set(updates)
        .where(and(eq(userProgress.userId, userId), eq(userProgress.countryCode, countryCode)));
    }
  }

  async getReviewItems(userId: string): Promise<UserProgress[]> {
    return await db
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.needsReview, true)))
      .orderBy(userProgress.masteryLevel);
  }

  // Quiz session methods
  async createQuizSession(session: InsertQuizSession): Promise<QuizSession> {
    const [quizSession] = await db
      .insert(quizSessions)
      .values(session)
      .returning();
    return quizSession;
  }

  async getQuizSession(sessionId: number): Promise<QuizSession | undefined> {
    const [session] = await db
      .select()
      .from(quizSessions)
      .where(eq(quizSessions.id, sessionId));
    return session;
  }

  async updateQuizSession(sessionId: number, updates: Partial<QuizSession>): Promise<void> {
    await db
      .update(quizSessions)
      .set(updates)
      .where(eq(quizSessions.id, sessionId));
  }

  async getUserQuizSessions(userId: string): Promise<QuizSession[]> {
    return await db
      .select()
      .from(quizSessions)
      .where(eq(quizSessions.userId, userId))
      .orderBy(desc(quizSessions.startedAt));
  }

  // Achievement methods
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId))
      .orderBy(desc(achievements.earnedAt));
  }

  async addAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db
      .insert(achievements)
      .values(achievement)
      .returning();
    return newAchievement;
  }

  // Daily stats methods
  async getDailyStats(userId: string, date: string): Promise<DailyStats | undefined> {
    const [stats] = await db
      .select()
      .from(dailyStats)
      .where(and(eq(dailyStats.userId, userId), eq(dailyStats.date, date)));
    return stats;
  }

  async updateDailyStats(userId: string, date: string, updates: Partial<InsertDailyStats>): Promise<void> {
    const existing = await this.getDailyStats(userId, date);
    
    if (!existing) {
      await db.insert(dailyStats).values({
        userId,
        date,
        countriesLearned: 0,
        questionsAnswered: 0,
        questionsCorrect: 0,
        studyTime: 0,
        ...updates
      });
    } else {
      await db
        .update(dailyStats)
        .set(updates)
        .where(and(eq(dailyStats.userId, userId), eq(dailyStats.date, date)));
    }
  }

  async getUserStats(userId: string): Promise<{
    totalCountriesMastered: number;
    accuracyRate: number;
    totalStudyTime: number;
    currentStreak: number;
  }> {
    const user = await this.getUser(userId);
    const progress = await this.getUserProgress(userId);
    
    const totalCountriesMastered = progress.filter(p => 
      (p.masteryLevel || 0) >= 85 && (p.totalAttempts || 0) >= 3
    ).length;
    
    // Calculate accuracy from user progress data instead of quiz sessions
    const totalAttempts = progress.reduce((sum, p) => sum + (p.totalAttempts || 0), 0);
    const totalCorrect = progress.reduce((sum, p) => sum + (p.correctAnswers || 0), 0);
    const accuracyRate = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
    
    return {
      totalCountriesMastered,
      accuracyRate,
      totalStudyTime: user?.totalStudyTime || 0,
      currentStreak: user?.currentStreak || 0,
    };
  }

  // Detailed analytics methods
  async getMasteryDetails(userId: string): Promise<{
    masteredCountries: Array<{countryCode: string; masteryLevel: number; correctAnswers: number; totalAttempts: number}>;
    unmasteredCountries: Array<{countryCode: string; masteryLevel: number; correctAnswers: number; totalAttempts: number}>;
  }> {
    const progress = await this.getUserProgress(userId);
    
    const masteredCountries = progress
      .filter(p => (p.masteryLevel || 0) >= 85 && (p.totalAttempts || 0) >= 3)
      .map(p => ({
        countryCode: p.countryCode,
        masteryLevel: p.masteryLevel || 0,
        correctAnswers: p.correctAnswers || 0,
        totalAttempts: p.totalAttempts || 0
      }));
    
    const unmasteredCountries = progress
      .filter(p => (p.masteryLevel || 0) < 85 || (p.totalAttempts || 0) < 3)
      .map(p => ({
        countryCode: p.countryCode,
        masteryLevel: p.masteryLevel || 0,
        correctAnswers: p.correctAnswers || 0,
        totalAttempts: p.totalAttempts || 0
      }));
    
    return { masteredCountries, unmasteredCountries };
  }

  async getStreakCalendar(userId: string, monthKey?: string): Promise<Array<{date: string; hasActivity: boolean; studyTime: number; questionsAnswered: number}>> {
    const stats = await db
      .select()
      .from(dailyStats)
      .where(eq(dailyStats.userId, userId))
      .orderBy(desc(dailyStats.date));
    
    return stats.map(stat => ({
      date: stat.date,
      hasActivity: (stat.studyTime || 0) > 0,
      studyTime: stat.studyTime || 0,
      questionsAnswered: stat.questionsAnswered || 0
    }));
  }

  async getAccuracyDetails(userId: string): Promise<{
    byDifficulty: Array<{difficulty: string; accuracy: number; totalQuestions: number}>;
    byStudyMode: Array<{mode: string; accuracy: number; totalQuestions: number}>;
    worstCountries: Array<{countryCode: string; accuracy: number; totalAttempts: number}>;
  }> {
    const sessions = await this.getUserQuizSessions(userId);
    const progress = await this.getUserProgress(userId);
    
    // Group by difficulty
    const byDifficulty = sessions.reduce((acc, session) => {
      const difficulty = session.difficulty;
      if (!acc[difficulty]) {
        acc[difficulty] = { totalQuestions: 0, totalCorrect: 0 };
      }
      acc[difficulty].totalQuestions += session.questionsAsked || 0;
      acc[difficulty].totalCorrect += session.questionsCorrect || 0;
      return acc;
    }, {} as Record<string, {totalQuestions: number; totalCorrect: number}>);
    
    // Group by study mode
    const byStudyMode = sessions.reduce((acc, session) => {
      const mode = session.mode;
      if (!acc[mode]) {
        acc[mode] = { totalQuestions: 0, totalCorrect: 0 };
      }
      acc[mode].totalQuestions += session.questionsAsked || 0;
      acc[mode].totalCorrect += session.questionsCorrect || 0;
      return acc;
    }, {} as Record<string, {totalQuestions: number; totalCorrect: number}>);
    
    // Worst countries
    const worstCountries = progress
      .filter(p => (p.totalAttempts || 0) >= 3)
      .map(p => ({
        countryCode: p.countryCode,
        accuracy: (p.correctAnswers || 0) / (p.totalAttempts || 1) * 100,
        totalAttempts: p.totalAttempts || 0
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 10);
    
    return {
      byDifficulty: Object.entries(byDifficulty).map(([difficulty, data]) => ({
        difficulty,
        accuracy: data.totalQuestions > 0 ? Math.round((data.totalCorrect / data.totalQuestions) * 100) : 0,
        totalQuestions: data.totalQuestions
      })),
      byStudyMode: Object.entries(byStudyMode).map(([mode, data]) => ({
        mode,
        accuracy: data.totalQuestions > 0 ? Math.round((data.totalCorrect / data.totalQuestions) * 100) : 0,
        totalQuestions: data.totalQuestions
      })),
      worstCountries
    };
  }

  async getStudyTimeBreakdown(userId: string, period: string): Promise<Array<{period: string; studyTime: number; sessionsCount: number}>> {
    const sessions = await this.getUserQuizSessions(userId);
    
    // Group sessions by time period
    const breakdown = sessions.reduce((acc, session) => {
      const date = session.startedAt?.toISOString().split('T')[0] || '';
      if (!acc[date]) {
        acc[date] = { studyTime: 0, sessionsCount: 0 };
      }
      acc[date].studyTime += Math.round((session.timeSpent || 0) / 60); // Convert to minutes
      acc[date].sessionsCount += 1;
      return acc;
    }, {} as Record<string, {studyTime: number; sessionsCount: number}>);
    
    return Object.entries(breakdown).map(([date, data]) => ({
      period: date,
      studyTime: data.studyTime,
      sessionsCount: data.sessionsCount
    }));
  }

  // Study goals methods
  async getUserStudyGoals(userId: string): Promise<StudyGoal[]> {
    return await db
      .select()
      .from(studyGoals)
      .where(eq(studyGoals.userId, userId))
      .orderBy(desc(studyGoals.createdAt));
  }

  async setStudyGoal(goal: InsertStudyGoal): Promise<StudyGoal> {
    const [newGoal] = await db
      .insert(studyGoals)
      .values(goal)
      .returning();
    return newGoal;
  }

  async updateStudyGoal(goalId: number, updates: Partial<StudyGoal>): Promise<void> {
    await db
      .update(studyGoals)
      .set(updates)
      .where(eq(studyGoals.id, goalId));
  }

  async deleteStudyGoal(goalId: number): Promise<void> {
    await db
      .delete(studyGoals)
      .where(eq(studyGoals.id, goalId));
  }

  // Dynamic difficulty methods
  async getRecommendedCountries(userId: string, difficultyLevel: DynamicDifficultyLevel, count: number = 20): Promise<CountryWithDynamicDifficulty[]> {
    // Use the dynamic difficulty function from shared module
    const { getRecommendedCountries } = await import("@shared/dynamic-difficulty");
    
    // Import countries data from the client data file
    const { countries } = await import("../client/src/data/countries");
    
    const progress = await this.getUserProgress(userId);
    
    // Use the shared function to get recommendations
    const recommendations = getRecommendedCountries(progress, countries, difficultyLevel, count);
    
    return recommendations;
  }

  async updateDifficultyRecommendation(userId: string, recommendation: InsertDifficultyRecommendation): Promise<DifficultyRecommendation> {
    const existing = await this.getDifficultyRecommendation(userId);
    
    if (existing) {
      const [updated] = await db
        .update(difficultyRecommendations)
        .set({
          ...recommendation,
          lastUpdated: new Date()
        })
        .where(eq(difficultyRecommendations.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(difficultyRecommendations)
        .values(recommendation)
        .returning();
      return created;
    }
  }

  async getDifficultyRecommendation(userId: string): Promise<DifficultyRecommendation | undefined> {
    const [recommendation] = await db
      .select()
      .from(difficultyRecommendations)
      .where(eq(difficultyRecommendations.userId, userId));
    return recommendation;
  }
}

export const storage = new DatabaseStorage();