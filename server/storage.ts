import { 
  users, userProgress, quizSessions, achievements, dailyStats,
  type User, type InsertUser, type UserProgress, type InsertUserProgress,
  type QuizSession, type InsertQuizSession, type Achievement, type InsertAchievement,
  type DailyStats, type InsertDailyStats, type StudyMode, type Difficulty
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStreak(userId: number, streak: number): Promise<void>;
  updateStudyTime(userId: number, minutes: number): Promise<void>;

  // Progress methods
  getUserProgress(userId: number): Promise<UserProgress[]>;
  getProgressByCountry(userId: number, countryCode: string): Promise<UserProgress | undefined>;
  updateProgress(userId: number, countryCode: string, correct: boolean): Promise<void>;
  getReviewItems(userId: number): Promise<UserProgress[]>;
  
  // Quiz session methods
  createQuizSession(session: InsertQuizSession): Promise<QuizSession>;
  updateQuizSession(sessionId: number, updates: Partial<QuizSession>): Promise<void>;
  getUserQuizSessions(userId: number): Promise<QuizSession[]>;
  
  // Achievement methods
  getUserAchievements(userId: number): Promise<Achievement[]>;
  addAchievement(achievement: InsertAchievement): Promise<Achievement>;
  
  // Daily stats methods
  getDailyStats(userId: number, date: string): Promise<DailyStats | undefined>;
  updateDailyStats(userId: number, date: string, updates: Partial<InsertDailyStats>): Promise<void>;
  getUserStats(userId: number): Promise<{
    totalCountriesMastered: number;
    accuracyRate: number;
    totalStudyTime: number;
    currentStreak: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private userProgress: Map<string, UserProgress> = new Map(); // key: userId-countryCode
  private quizSessions: Map<number, QuizSession> = new Map();
  private achievements: Map<number, Achievement[]> = new Map();
  private dailyStats: Map<string, DailyStats> = new Map(); // key: userId-date
  private currentId: number = 1;
  private sessionId: number = 1;
  private achievementId: number = 1;
  private progressId: number = 1;
  private statsId: number = 1;

  constructor() {
    // Create default user for demo
    this.createUser({
      username: "Alex",
      email: "alex@example.com",
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = {
      ...insertUser,
      id,
      currentStreak: 7,
      totalStudyTime: 720, // 12 hours in minutes
      createdAt: new Date(),
    };
    this.users.set(id, user);
    
    // Initialize some demo achievements
    await this.addAchievement({
      userId: id,
      type: 'streak',
      title: 'Week Warrior',
      description: '7-day learning streak',
    });
    
    return user;
  }

  async updateUserStreak(userId: number, streak: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.currentStreak = streak;
      this.users.set(userId, user);
    }
  }

  async updateStudyTime(userId: number, minutes: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.totalStudyTime = (user.totalStudyTime || 0) + minutes;
      this.users.set(userId, user);
    }
  }

  async getUserProgress(userId: number): Promise<UserProgress[]> {
    return Array.from(this.userProgress.values()).filter(p => p.userId === userId);
  }

  async getProgressByCountry(userId: number, countryCode: string): Promise<UserProgress | undefined> {
    return this.userProgress.get(`${userId}-${countryCode}`);
  }

  async updateProgress(userId: number, countryCode: string, correct: boolean): Promise<void> {
    const key = `${userId}-${countryCode}`;
    let progress = this.userProgress.get(key);
    
    if (!progress) {
      progress = {
        id: this.progressId++,
        userId,
        countryCode,
        masteryLevel: 0,
        correctAnswers: 0,
        totalAttempts: 0,
        lastReviewed: new Date(),
        needsReview: false,
      };
    }
    
    progress.totalAttempts++;
    if (correct) {
      progress.correctAnswers++;
      progress.masteryLevel = Math.min(100, progress.masteryLevel + 10);
    } else {
      progress.masteryLevel = Math.max(0, progress.masteryLevel - 5);
      progress.needsReview = progress.masteryLevel < 50;
    }
    
    progress.lastReviewed = new Date();
    this.userProgress.set(key, progress);
  }

  async getReviewItems(userId: number): Promise<UserProgress[]> {
    return Array.from(this.userProgress.values())
      .filter(p => p.userId === userId && p.needsReview)
      .sort((a, b) => a.masteryLevel - b.masteryLevel);
  }

  async createQuizSession(session: InsertQuizSession): Promise<QuizSession> {
    const id = this.sessionId++;
    const quizSession: QuizSession = {
      ...session,
      id,
      startedAt: new Date(),
      completedAt: null,
    };
    this.quizSessions.set(id, quizSession);
    return quizSession;
  }

  async updateQuizSession(sessionId: number, updates: Partial<QuizSession>): Promise<void> {
    const session = this.quizSessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
      if (updates.completed) {
        session.completedAt = new Date();
      }
      this.quizSessions.set(sessionId, session);
    }
  }

  async getUserQuizSessions(userId: number): Promise<QuizSession[]> {
    return Array.from(this.quizSessions.values()).filter(s => s.userId === userId);
  }

  async getUserAchievements(userId: number): Promise<Achievement[]> {
    return this.achievements.get(userId) || [];
  }

  async addAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const id = this.achievementId++;
    const newAchievement: Achievement = {
      ...achievement,
      id,
      earnedAt: new Date(),
    };
    
    const userAchievements = this.achievements.get(achievement.userId) || [];
    userAchievements.push(newAchievement);
    this.achievements.set(achievement.userId, userAchievements);
    
    return newAchievement;
  }

  async getDailyStats(userId: number, date: string): Promise<DailyStats | undefined> {
    return this.dailyStats.get(`${userId}-${date}`);
  }

  async updateDailyStats(userId: number, date: string, updates: Partial<InsertDailyStats>): Promise<void> {
    const key = `${userId}-${date}`;
    let stats = this.dailyStats.get(key);
    
    if (!stats) {
      stats = {
        id: this.statsId++,
        userId,
        date,
        countriesLearned: 0,
        questionsAnswered: 0,
        questionsCorrect: 0,
        studyTime: 0,
      };
    }
    
    Object.assign(stats, updates);
    this.dailyStats.set(key, stats);
  }

  async getUserStats(userId: number): Promise<{
    totalCountriesMastered: number;
    accuracyRate: number;
    totalStudyTime: number;
    currentStreak: number;
  }> {
    const user = await this.getUser(userId);
    const progress = await this.getUserProgress(userId);
    const sessions = await this.getUserQuizSessions(userId);
    
    const totalCountriesMastered = progress.filter(p => p.masteryLevel >= 80).length;
    const totalQuestions = sessions.reduce((sum, s) => sum + s.questionsAsked, 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + s.questionsCorrect, 0);
    const accuracyRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    
    return {
      totalCountriesMastered,
      accuracyRate,
      totalStudyTime: user?.totalStudyTime || 0,
      currentStreak: user?.currentStreak || 0,
    };
  }
}

export const storage = new MemStorage();
