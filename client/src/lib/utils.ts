import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatStudyTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function calculateAccuracy(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateQuizOptions(correctAnswer: string, allOptions: string[], count: number = 4): string[] {
  // Filter out the correct answer and remove any empty/undefined values
  const incorrectOptions = allOptions
    .filter(option => option && option !== correctAnswer && option.trim().length > 0);
  
  // If we don't have enough incorrect options, repeat some to fill the requirement
  const shuffledIncorrect = shuffleArray(incorrectOptions);
  let selectedIncorrect = shuffledIncorrect.slice(0, count - 1);
  
  // Ensure we always have exactly count-1 incorrect options
  while (selectedIncorrect.length < count - 1 && incorrectOptions.length > 0) {
    const additionalOptions = shuffleArray(incorrectOptions).slice(0, (count - 1) - selectedIncorrect.length);
    selectedIncorrect = [...selectedIncorrect, ...additionalOptions];
  }
  
  // Take only the number we need
  selectedIncorrect = selectedIncorrect.slice(0, count - 1);
  
  const options = [correctAnswer, ...selectedIncorrect];
  return shuffleArray(options);
}

export function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/[^\w\s]/g, '');
}

export function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);
  
  if (normalized1 === normalized2) return 1;
  
  // Simple Levenshtein distance calculation
  const matrix = Array(normalized2.length + 1).fill(null).map(() => Array(normalized1.length + 1).fill(null));
  
  for (let i = 0; i <= normalized1.length; i++) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= normalized2.length; j++) {
    matrix[j][0] = j;
  }
  
  for (let j = 1; j <= normalized2.length; j++) {
    for (let i = 1; i <= normalized1.length; i++) {
      const indicator = normalized1[i - 1] === normalized2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  const maxLength = Math.max(normalized1.length, normalized2.length);
  return 1 - matrix[normalized2.length][normalized1.length] / maxLength;
}

export function isTypingCorrect(userInput: string, correctAnswer: string, threshold: number = 0.8): boolean {
  return calculateSimilarity(userInput, correctAnswer) >= threshold;
}
