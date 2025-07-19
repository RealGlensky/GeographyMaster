import { 
  users, userProgress, quizSessions, achievements, dailyStats, studyGoals,
  type User, type InsertUser, type UserProgress, type InsertUserProgress,
  type QuizSession, type InsertQuizSession, type Achievement, type InsertAchievement,
  type DailyStats, type InsertDailyStats, type StudyGoal, type InsertStudyGoal,
  type StudyMode, type Difficulty
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStreak(userId: number, streak: number): Promise<void>;
  updateStudyTime(userId: number, minutes: number): Promise<void>;
  updateExcludedCountries(userId: number, excludedCountries: string[]): Promise<void>;

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

  // Detailed analytics methods
  getMasteryDetails(userId: number): Promise<{
    masteredCountries: Array<{countryCode: string; masteryLevel: number; correctAnswers: number; totalAttempts: number}>;
    unmasteredCountries: Array<{countryCode: string; masteryLevel: number; correctAnswers: number; totalAttempts: number}>;
  }>;
  
  getStreakCalendar(userId: number, monthKey?: string): Promise<Array<{date: string; hasActivity: boolean; studyTime: number; questionsAnswered: number}>>;
  
  getAccuracyDetails(userId: number, difficulty?: string): Promise<{
    byDifficulty: Array<{difficulty: string; accuracy: number; totalQuestions: number}>;
    byStudyMode: Array<{mode: string; accuracy: number; totalQuestions: number}>;
    worstCountries: Array<{countryCode: string; accuracy: number; totalAttempts: number}>;
  }>;
  
  getStudyTimeBreakdown(userId: number, period: string): Promise<Array<{period: string; studyTime: number; sessionsCount: number}>>;
  
  // Study goals methods
  getUserStudyGoals(userId: number): Promise<StudyGoal[]>;
  setStudyGoal(goal: InsertStudyGoal): Promise<StudyGoal>;
  updateStudyGoal(goalId: number, updates: Partial<StudyGoal>): Promise<void>;
  deleteStudyGoal(goalId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private userProgress: Map<string, UserProgress> = new Map(); // key: userId-countryCode
  private quizSessions: Map<number, QuizSession> = new Map();
  private achievements: Map<number, Achievement[]> = new Map();
  private dailyStats: Map<string, DailyStats> = new Map(); // key: userId-date
  private studyGoals: Map<number, StudyGoal> = new Map();
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
    
    // Add sample data for demonstration
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    const userId = 1;
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Add some sample progress data
    const sampleCountries = ['US', 'CA', 'FR', 'DE', 'JP', 'AU', 'BR', 'IN', 'UK', 'IT'];
    sampleCountries.forEach((countryCode, index) => {
      const masteryLevel = Math.floor(Math.random() * 100);
      const correctAnswers = Math.floor(Math.random() * 20) + 5;
      const totalAttempts = correctAnswers + Math.floor(Math.random() * 10);
      
      this.userProgress.set(`${userId}-${countryCode}`, {
        id: this.progressId++,
        userId,
        countryCode,
        masteryLevel,
        correctAnswers,
        totalAttempts,
        lastReviewed: new Date(),
        needsReview: masteryLevel < 80
      });
    });

    // Add sample quiz sessions
    for (let i = 0; i < 10; i++) {
      const sessionDate = new Date();
      sessionDate.setDate(sessionDate.getDate() - i);
      
      this.quizSessions.set(this.sessionId++, {
        id: this.sessionId,
        userId,
        mode: ['quiz', 'flashcards', 'typing'][Math.floor(Math.random() * 3)],
        difficulty: ['beginner', 'intermediate', 'expert'][Math.floor(Math.random() * 3)],
        questionsAsked: 10,
        questionsCorrect: Math.floor(Math.random() * 8) + 2,
        timeSpent: Math.floor(Math.random() * 600) + 300, // 5-15 minutes
        completed: true,
        startedAt: sessionDate,
        completedAt: sessionDate
      });
    }

    // Add sample daily stats
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // 70% chance of activity
      if (Math.random() > 0.3) {
        this.dailyStats.set(`${userId}-${dateStr}`, {
          id: this.statsId++,
          userId,
          date: dateStr,
          countriesLearned: Math.floor(Math.random() * 5) + 1,
          questionsAnswered: Math.floor(Math.random() * 20) + 5,
          questionsCorrect: Math.floor(Math.random() * 15) + 3,
          studyTime: Math.floor(Math.random() * 45) + 5 // 5-50 minutes
        });
      }
    }

    // Update user with realistic stats
    const user = this.users.get(userId);
    if (user) {
      user.currentStreak = 7;
      user.totalStudyTime = 720; // 12 hours
    }
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
      excludedCountries: insertUser.excludedCountries || [],
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

  async updateExcludedCountries(userId: number, excludedCountries: string[]): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.excludedCountries = excludedCountries;
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
    }
    
    // Enhanced mastery calculation
    const accuracyRate = progress.correctAnswers / progress.totalAttempts;
    const recentPerformance = this.calculateRecentPerformance(progress);
    const consistencyBonus = this.calculateConsistencyBonus(progress);
    const timeDecay = this.calculateTimeDecay(progress.lastReviewed);
    
    // Base mastery from accuracy (0-70 points)
    let baseMastery = Math.round(accuracyRate * 70);
    
    // Consistency bonus (0-20 points) - requires multiple attempts
    if (progress.totalAttempts >= 3) {
      baseMastery += consistencyBonus;
    }
    
    // Recent performance bonus (0-10 points)
    baseMastery += recentPerformance;
    
    // Apply time decay (reduces mastery over time without practice)
    progress.masteryLevel = Math.max(0, Math.min(100, baseMastery - timeDecay));
    
    // Update review status
    progress.needsReview = progress.masteryLevel < 70 || accuracyRate < 0.6;
    progress.lastReviewed = new Date();
    
    this.userProgress.set(key, progress);
  }

  private calculateRecentPerformance(progress: any): number {
    // Simple implementation - in real app would track recent answers
    const accuracyRate = progress.correctAnswers / progress.totalAttempts;
    if (accuracyRate >= 0.8) return 10;
    if (accuracyRate >= 0.6) return 5;
    return 0;
  }

  private calculateConsistencyBonus(progress: any): number {
    // Bonus for having multiple correct answers
    if (progress.totalAttempts >= 5 && progress.correctAnswers >= 4) return 20;
    if (progress.totalAttempts >= 3 && progress.correctAnswers >= 2) return 15;
    if (progress.totalAttempts >= 2 && progress.correctAnswers >= 2) return 10;
    return 0;
  }

  private calculateTimeDecay(lastReviewed: Date): number {
    const daysSinceReview = (Date.now() - lastReviewed.getTime()) / (1000 * 60 * 60 * 24);
    
    // Gradual decay over time
    if (daysSinceReview > 30) return 20; // Significant decay after a month
    if (daysSinceReview > 14) return 10; // Some decay after 2 weeks
    if (daysSinceReview > 7) return 5;   // Minor decay after a week
    return 0; // No decay in first week
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
    
    const totalCountriesMastered = progress.filter(p => p.masteryLevel >= 85 && p.totalAttempts >= 3).length;
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

  async getMasteryDetails(userId: number): Promise<{
    masteredCountries: Array<{countryCode: string; masteryLevel: number; correctAnswers: number; totalAttempts: number}>;
    unmasteredCountries: Array<{countryCode: string; masteryLevel: number; correctAnswers: number; totalAttempts: number}>;
  }> {
    const progress = await this.getUserProgress(userId);
    
    const masteredCountries = progress
      .filter(p => p.masteryLevel >= 85 && p.totalAttempts >= 3)  // Requires minimum attempts
      .map(p => ({
        countryCode: p.countryCode,
        masteryLevel: p.masteryLevel,
        correctAnswers: p.correctAnswers,
        totalAttempts: p.totalAttempts
      }));
    
    const unmasteredCountries = progress
      .filter(p => p.masteryLevel < 85 || p.totalAttempts < 3)
      .map(p => ({
        countryCode: p.countryCode,
        masteryLevel: p.masteryLevel,
        correctAnswers: p.correctAnswers,
        totalAttempts: p.totalAttempts
      }));
    
    return { masteredCountries, unmasteredCountries };
  }

  async getStreakCalendar(userId: number, monthKey?: string): Promise<Array<{date: string; hasActivity: boolean; studyTime: number; questionsAnswered: number}>> {
    let startDate: Date;
    let endDate: Date;
    
    if (monthKey) {
      // Parse monthKey format: YYYY-MM
      const [year, month] = monthKey.split('-').map(Number);
      startDate = new Date(year, month - 1, 1); // month is 0-indexed
      endDate = new Date(year, month, 0); // Last day of the month
    } else {
      // Default to current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    
    const calendarData = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const stats = await this.getDailyStats(userId, dateStr);
      
      calendarData.push({
        date: dateStr,
        hasActivity: stats ? stats.studyTime > 0 : false,
        studyTime: stats?.studyTime || 0,
        questionsAnswered: stats?.questionsAnswered || 0
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return calendarData;
  }

  async getAccuracyDetails(userId: number, difficulty?: string): Promise<{
    byDifficulty: Array<{difficulty: string; accuracy: number; totalQuestions: number}>;
    byStudyMode: Array<{mode: string; accuracy: number; totalQuestions: number}>;
    worstCountries: Array<{countryCode: string; accuracy: number; totalAttempts: number}>;
  }> {
    const allSessions = await this.getUserQuizSessions(userId);
    const sessions = difficulty ? allSessions.filter(s => s.difficulty === difficulty) : allSessions;
    const progress = await this.getUserProgress(userId);
    
    // Group by difficulty
    const difficultyMap = new Map<string, {correct: number; total: number}>();
    sessions.forEach(session => {
      const existing = difficultyMap.get(session.difficulty) || {correct: 0, total: 0};
      existing.correct += session.questionsCorrect;
      existing.total += session.questionsAsked;
      difficultyMap.set(session.difficulty, existing);
    });
    
    const byDifficulty = Array.from(difficultyMap.entries()).map(([difficulty, data]) => ({
      difficulty,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      totalQuestions: data.total
    }));
    
    // Group by study mode
    const modeMap = new Map<string, {correct: number; total: number}>();
    sessions.forEach(session => {
      const existing = modeMap.get(session.mode) || {correct: 0, total: 0};
      existing.correct += session.questionsCorrect;
      existing.total += session.questionsAsked;
      modeMap.set(session.mode, existing);
    });
    
    const byStudyMode = Array.from(modeMap.entries()).map(([mode, data]) => ({
      mode,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      totalQuestions: data.total
    }));
    
    // Worst performing countries (filter by difficulty-specific sessions if specified)
    let filteredProgress = progress.filter(p => p.totalAttempts > 0);
    
    // If filtering by difficulty, only include countries that were studied in that difficulty
    if (difficulty) {
      const difficultySessions = sessions.filter(s => s.difficulty === difficulty);
      // For now, include all countries since we don't track difficulty per country attempt
      // This could be enhanced in the future to track country-specific difficulty performance
    }
    
    const worstCountries = filteredProgress
      .map(p => ({
        countryCode: p.countryCode,
        accuracy: Math.round((p.correctAnswers / p.totalAttempts) * 100),
        totalAttempts: p.totalAttempts
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 10);
    
    return { byDifficulty, byStudyMode, worstCountries };
  }

  async getStudyTimeBreakdown(userId: number, period: string): Promise<Array<{period: string; studyTime: number; sessionsCount: number}>> {
    const sessions = await this.getUserQuizSessions(userId);
    const now = new Date();
    
    const data = [];
    const daysToShow = period === 'daily' ? 7 : period === 'weekly' ? 4 : period === 'monthly' ? 12 : period === 'yearly' ? 5 : 30;
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      let periodStart: Date;
      let periodLabel: string;
      
      if (period === 'daily') {
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - i);
        periodLabel = periodStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      } else if (period === 'weekly') {
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - (i * 7));
        periodLabel = `Week ${daysToShow - i}`;
      } else if (period === 'monthly') {
        periodStart = new Date(now);
        periodStart.setMonth(now.getMonth() - i);
        periodLabel = periodStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } else {
        periodStart = new Date(now);
        periodStart.setFullYear(now.getFullYear() - i);
        periodLabel = periodStart.getFullYear().toString();
      }
      
      const periodSessions = sessions.filter(session => {
        const sessionDate = new Date(session.startedAt);
        return sessionDate >= periodStart && 
               (period === 'daily' ? sessionDate.toDateString() === periodStart.toDateString() :
                period === 'weekly' ? sessionDate >= periodStart && sessionDate < new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000) :
                period === 'monthly' ? sessionDate.getMonth() === periodStart.getMonth() && sessionDate.getFullYear() === periodStart.getFullYear() :
                sessionDate.getFullYear() === periodStart.getFullYear());
      });
      
      const totalTime = periodSessions.reduce((sum, s) => sum + (s.timeSpent || 0), 0);
      
      data.push({
        period: periodLabel,
        studyTime: Math.round(totalTime / 60), // Convert to minutes
        sessionsCount: periodSessions.length
      });
    }
    
    return data;
  }

  // Study goals methods
  async getUserStudyGoals(userId: number): Promise<StudyGoal[]> {
    const goals = Array.from(this.studyGoals.values()).filter(goal => goal.userId === userId);
    return goals;
  }

  async setStudyGoal(goal: InsertStudyGoal): Promise<StudyGoal> {
    const id = this.currentId++;
    const newGoal: StudyGoal = {
      id,
      ...goal,
      createdAt: new Date(),
    };
    
    // Deactivate existing goals for the same period
    const existingGoals = await this.getUserStudyGoals(goal.userId);
    existingGoals
      .filter(g => g.period === goal.period && g.isActive)
      .forEach(g => {
        g.isActive = false;
        this.studyGoals.set(g.id, g);
      });
    
    this.studyGoals.set(id, newGoal);
    return newGoal;
  }

  async updateStudyGoal(goalId: number, updates: Partial<StudyGoal>): Promise<void> {
    const goal = this.studyGoals.get(goalId);
    if (!goal) return;
    
    const updatedGoal = { ...goal, ...updates };
    this.studyGoals.set(goalId, updatedGoal);
  }

  async deleteStudyGoal(goalId: number): Promise<void> {
    this.studyGoals.delete(goalId);
  }
}

export const storage = new MemStorage();
