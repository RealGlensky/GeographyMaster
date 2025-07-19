import { UserProgress, Country, CountryWithDynamicDifficulty } from "./schema";

export interface DifficultyMetrics {
  masteryLevel: number;
  personalDifficultyRating: number;
  consistencyScore: number;
  averageResponseTime: number;
  totalAttempts: number;
  correctAnswers: number;
  lastReviewed: Date | null;
}

export interface DynamicDifficultyConfig {
  targetAccuracy: number; // Target accuracy rate (0-100)
  adaptationRate: number; // How quickly to adapt difficulty (0-1)
  masteryThreshold: number; // Mastery level threshold (0-100)
  reviewInterval: number; // Days before review is needed
  challengeBoost: number; // Difficulty boost for challenge mode
}

export const DEFAULT_CONFIG: DynamicDifficultyConfig = {
  targetAccuracy: 75,
  adaptationRate: 0.1,
  masteryThreshold: 85,
  reviewInterval: 7,
  challengeBoost: 15,
};

/**
 * Calculate dynamic difficulty rating for a country based on user performance
 */
export function calculateDynamicDifficulty(
  progress: UserProgress,
  config: DynamicDifficultyConfig = DEFAULT_CONFIG
): number {
  if (!progress.totalAttempts) {
    // No attempts yet - start with baseline static difficulty
    return progress.personalDifficultyRating || 50;
  }

  const accuracyRate = (progress.correctAnswers / progress.totalAttempts) * 100;
  const currentDifficulty = progress.personalDifficultyRating || 50;
  
  // Calculate adjustment based on performance vs target
  const performanceDelta = accuracyRate - config.targetAccuracy;
  
  // Adjust difficulty: if performing well, increase difficulty; if struggling, decrease
  let newDifficulty = currentDifficulty - (performanceDelta * config.adaptationRate);
  
  // Apply consistency bonus/penalty
  const consistencyFactor = progress.consistencyScore / 100;
  newDifficulty *= (0.8 + 0.4 * consistencyFactor); // Range: 0.8x to 1.2x
  
  // Apply mastery bonus - mastered countries get slightly easier to maintain
  if (progress.masteryLevel >= config.masteryThreshold) {
    newDifficulty *= 0.9;
  }
  
  // Clamp to valid range
  return Math.max(0, Math.min(100, Math.round(newDifficulty)));
}

/**
 * Calculate consistency score based on recent performance pattern
 */
export function calculateConsistencyScore(recentResults: boolean[]): number {
  if (recentResults.length === 0) return 50;
  
  let consistencySum = 0;
  for (let i = 1; i < recentResults.length; i++) {
    if (recentResults[i] === recentResults[i-1]) {
      consistencySum += 1;
    }
  }
  
  const consistencyRatio = consistencySum / Math.max(1, recentResults.length - 1);
  return Math.round(consistencyRatio * 100);
}

/**
 * Determine if a country needs review based on mastery level and time since last review
 */
export function needsReview(
  progress: UserProgress,
  config: DynamicDifficultyConfig = DEFAULT_CONFIG
): boolean {
  if (!progress.lastReviewed) return false;
  
  const daysSinceReview = (Date.now() - progress.lastReviewed.getTime()) / (1000 * 60 * 60 * 24);
  const masteryFactor = Math.max(0.5, progress.masteryLevel / 100);
  const adjustedInterval = config.reviewInterval / masteryFactor;
  
  return daysSinceReview >= adjustedInterval;
}

/**
 * Get recommended countries for a user based on their progress and difficulty preference
 */
export function getRecommendedCountries(
  userProgress: UserProgress[],
  allCountries: Country[],
  targetDifficultyLevel: 'review' | 'adaptive' | 'challenge' | 'mastery',
  count: number = 10,
  config: DynamicDifficultyConfig = DEFAULT_CONFIG
): CountryWithDynamicDifficulty[] {
  const progressMap = new Map(userProgress.map(p => [p.countryCode, p]));
  
  const countriesWithDifficulty = allCountries.map(country => {
    const progress = progressMap.get(country.code);
    const personalDifficultyRating = progress 
      ? calculateDynamicDifficulty(progress, config)
      : getStaticDifficultyRating(country.difficulty);
    
    return {
      ...country,
      personalDifficultyRating,
      masteryLevel: progress?.masteryLevel || 0,
      isRecommended: false,
      recommendationReason: '',
    };
  });
  
  // Filter and sort based on target difficulty level
  let filteredCountries: CountryWithDynamicDifficulty[] = [];
  
  switch (targetDifficultyLevel) {
    case 'review':
      // Countries that need review (be more inclusive to ensure availability)
      filteredCountries = countriesWithDifficulty.filter(country => {
        const progress = progressMap.get(country.code);
        // Include ANY country that has been attempted and isn't fully mastered
        return progress && progress.totalAttempts > 0 && (country.masteryLevel || 0) < config.masteryThreshold;
      });
      
      // If still no countries, include countries with any progress at all
      if (filteredCountries.length === 0) {
        filteredCountries = countriesWithDifficulty.filter(country => {
          const progress = progressMap.get(country.code);
          return progress && (progress.totalAttempts > 0 || (country.masteryLevel || 0) > 0);
        });
      }
      
      // Sort by those most needing review (lower mastery levels first)
      filteredCountries.sort((a, b) => (a.masteryLevel || 0) - (b.masteryLevel || 0));
      filteredCountries.forEach(c => c.recommendationReason = 'Review and reinforce');
      break;
      
    case 'adaptive':
      // Countries at appropriate difficulty level (not too easy, not too hard)
      filteredCountries = countriesWithDifficulty.filter(country => {
        const difficulty = country.personalDifficultyRating || 50;
        return difficulty >= 30 && difficulty <= 70 && (country.masteryLevel || 0) < config.masteryThreshold;
      });
      filteredCountries.forEach(c => c.recommendationReason = 'Good challenge level');
      break;
      
    case 'challenge':
      // Harder countries for users who want a challenge
      filteredCountries = countriesWithDifficulty.filter(country => {
        const difficulty = (country.personalDifficultyRating || 50) + config.challengeBoost;
        return difficulty > 60 && (country.masteryLevel || 0) < config.masteryThreshold;
      });
      filteredCountries.forEach(c => c.recommendationReason = 'Challenge mode');
      break;
      
    case 'mastery':
      // Countries close to mastery that need final push
      filteredCountries = countriesWithDifficulty.filter(country => {
        const mastery = country.masteryLevel || 0;
        return mastery >= 60 && mastery < config.masteryThreshold;
      });
      filteredCountries.forEach(c => c.recommendationReason = 'Close to mastery');
      break;
  }
  
  // Ensure we have at least some countries for any mode by falling back to adaptive recommendations
  if (filteredCountries.length === 0 && targetDifficultyLevel !== 'adaptive') {
    filteredCountries = countriesWithDifficulty.filter(country => {
      const difficulty = country.personalDifficultyRating || 50;
      return difficulty >= 30 && difficulty <= 70 && (country.masteryLevel || 0) < config.masteryThreshold;
    }).slice(0, Math.max(3, count));
    filteredCountries.forEach(c => c.recommendationReason = `Fallback from ${targetDifficultyLevel} mode`);
  }

  // Sort by recommendation strength and return top count
  const sortedCountries = filteredCountries
    .sort((a, b) => {
      // Prioritize review countries
      if (targetDifficultyLevel === 'review') {
        const progressA = progressMap.get(a.code);
        const progressB = progressMap.get(b.code);
        const daysSinceA = progressA?.lastReviewed ? (Date.now() - progressA.lastReviewed.getTime()) / (1000 * 60 * 60 * 24) : 0;
        const daysSinceB = progressB?.lastReviewed ? (Date.now() - progressB.lastReviewed.getTime()) / (1000 * 60 * 60 * 24) : 0;
        return daysSinceB - daysSinceA;
      }
      
      // For other modes, prioritize by difficulty appropriateness
      const diffA = Math.abs((a.personalDifficultyRating || 50) - config.targetAccuracy);
      const diffB = Math.abs((b.personalDifficultyRating || 50) - config.targetAccuracy);
      return diffA - diffB;
    })
    .slice(0, count);
    
  sortedCountries.forEach(c => c.isRecommended = true);
  
  return sortedCountries;
}

/**
 * Convert static difficulty to numeric rating
 */
function getStaticDifficultyRating(difficulty: string): number {
  switch (difficulty) {
    case 'beginner': return 20;
    case 'easy': return 35;
    case 'intermediate': return 50;
    case 'advanced': return 70;
    case 'expert': return 85;
    default: return 50;
  }
}

/**
 * Update user progress after a quiz attempt
 */
export function updateProgressAfterAttempt(
  currentProgress: UserProgress,
  isCorrect: boolean,
  responseTime: number,
  recentResults: boolean[] = []
): Partial<UserProgress> {
  const newTotalAttempts = currentProgress.totalAttempts + 1;
  const newCorrectAnswers = currentProgress.correctAnswers + (isCorrect ? 1 : 0);
  const accuracy = (newCorrectAnswers / newTotalAttempts) * 100;
  
  // Update average response time
  const newAvgResponseTime = Math.round(
    (currentProgress.averageResponseTime * currentProgress.totalAttempts + responseTime) / newTotalAttempts
  );
  
  // Calculate new mastery level with multi-factor approach
  const baseAccuracy = Math.min(100, accuracy);
  const attemptBonus = Math.min(10, newTotalAttempts * 2); // Up to 10 points for attempts
  const consistencyBonus = calculateConsistencyScore([...recentResults, isCorrect]) / 10; // Up to 10 points
  const speedBonus = responseTime < 5000 ? 5 : responseTime < 10000 ? 2 : 0; // Up to 5 points for speed
  
  const newMasteryLevel = Math.min(100, Math.round(
    baseAccuracy + attemptBonus + consistencyBonus + speedBonus
  ));
  
  // Update consistency score
  const newConsistencyScore = calculateConsistencyScore([...recentResults, isCorrect]);
  
  // Update personal difficulty rating
  const newPersonalDifficulty = calculateDynamicDifficulty({
    ...currentProgress,
    totalAttempts: newTotalAttempts,
    correctAnswers: newCorrectAnswers,
    consistencyScore: newConsistencyScore,
  });
  
  return {
    totalAttempts: newTotalAttempts,
    correctAnswers: newCorrectAnswers,
    masteryLevel: newMasteryLevel,
    averageResponseTime: newAvgResponseTime,
    consistencyScore: newConsistencyScore,
    personalDifficultyRating: newPersonalDifficulty,
    lastReviewed: new Date(),
    needsReview: false,
  };
}