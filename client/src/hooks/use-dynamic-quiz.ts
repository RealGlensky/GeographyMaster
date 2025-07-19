import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  QuizQuestion, 
  Country, 
  StudyMode, 
  DynamicDifficultyLevel, 
  CountryWithDynamicDifficulty,
  User 
} from "@shared/schema";
import { generateQuizOptions, shuffleArray } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { updateProgressAfterAttempt } from "@shared/dynamic-difficulty";

interface DynamicQuizState {
  sessionId: number | null;
  currentQuestion: number;
  totalQuestions: number;
  score: number;
  questions: QuizQuestion[];
  currentQuestionData: QuizQuestion | null;
  timeRemaining: number;
  isComplete: boolean;
  selectedAnswer: string | null;
  showResult: boolean;
  currentCountry: CountryWithDynamicDifficulty | null;
  questionStartTime: number | null;
}

interface UseDynamicQuizOptions {
  mode: StudyMode;
  difficultyLevel: DynamicDifficultyLevel;
  questionCount?: number;
  timePerQuestion?: number;
}

export function useDynamicQuiz({ 
  mode, 
  difficultyLevel, 
  questionCount = 20, 
  timePerQuestion = 30 
}: UseDynamicQuizOptions) {
  const queryClient = useQueryClient();
  
  // Get user data
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  // Get recommended countries based on dynamic difficulty
  const { data: recommendedCountries, isLoading: isLoadingRecommendations, error } = useQuery({
    queryKey: ['/api/user/recommended-countries', difficultyLevel, questionCount],
    queryFn: async () => {
      const response = await fetch(`/api/user/recommended-countries?level=${difficultyLevel}&count=${questionCount * 2}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json() as CountryWithDynamicDifficulty[];
      return result;
    },
    staleTime: 30000, // Prevent too frequent refetches
    refetchOnWindowFocus: false,
    retry: 3,
  });

  if (error) {
    console.error('Error fetching recommended countries:', error);
  }
  
  const [quizState, setQuizState] = useState<DynamicQuizState>({
    sessionId: null,
    currentQuestion: 0,
    totalQuestions: questionCount,
    score: 0,
    questions: [],
    currentQuestionData: null,
    timeRemaining: timePerQuestion,
    isComplete: false,
    selectedAnswer: null,
    showResult: false,
    currentCountry: null,
    questionStartTime: null,
  });

  // Generate questions from recommended countries
  const generateQuestions = useCallback((countries: CountryWithDynamicDifficulty[]): QuizQuestion[] => {
    if (!countries || countries.length === 0) return [];
    
    const shuffledCountries = shuffleArray(countries).slice(0, questionCount);
    const allCapitals = countries.map(c => c.capital);
    const allCountryNames = countries.map(c => c.name);

    return shuffledCountries.map((country, index) => {
      const isCountryToCapital = Math.random() > 0.5;
      
      if (isCountryToCapital) {
        return {
          id: `${index}`,
          type: 'country-to-capital' as const,
          country: country.name,
          capital: country.capital,
          options: generateQuizOptions(country.capital, allCapitals),
          correctAnswer: country.capital,
        };
      } else {
        return {
          id: `${index}`,
          type: 'capital-to-country' as const,
          country: country.name,
          capital: country.capital,
          options: generateQuizOptions(country.name, allCountryNames),
          correctAnswer: country.name,
        };
      }
    });
  }, [questionCount]);

  // Update progress with detailed metrics
  const updateProgressMutation = useMutation({
    mutationFn: async ({ countryCode, isCorrect, responseTime, updates }: {
      countryCode: string;
      isCorrect: boolean;
      responseTime: number;
      updates?: any;
    }) => {
      const response = await fetch('/api/user/update-progress-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryCode, isCorrect, responseTime, updates }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/user/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/recommended-countries'] });
    }
  });

  // Start quiz
  const startQuiz = useCallback(async () => {
    if (!recommendedCountries || recommendedCountries.length === 0) {
      console.error('Cannot start quiz: No recommended countries available');
      return;
    }

    const questions = generateQuestions(recommendedCountries);
    console.log(`Starting Smart Quiz with ${questions.length} questions in ${difficultyLevel} mode`);
    
    if (questions.length === 0) {
      console.error('No questions generated from recommended countries');
      return;
    }
    
    // Create quiz session
    const sessionData = {
      userId: 1, // Demo user
      mode,
      difficulty: 'adaptive', // Use adaptive as default for dynamic mode
      questionsAsked: questionCount,
      questionsCorrect: 0,
      timeSpent: 0,
      completed: false,
    };

    try {
      const response = await fetch('/api/quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const session = await response.json();

      console.log('Quiz session created:', session);
      console.log('First question:', questions[0]);
      
      setQuizState({
        sessionId: session.id,
        currentQuestion: 0,
        totalQuestions: questionCount,
        score: 0,
        questions,
        currentQuestionData: questions[0] || null,
        timeRemaining: timePerQuestion,
        isComplete: false,
        selectedAnswer: null,
        showResult: false,
        currentCountry: recommendedCountries.find(c => 
          c.name === questions[0]?.country || c.capital === questions[0]?.capital
        ) || null,
        questionStartTime: Date.now(),
      });
      
      console.log('Quiz state updated, ready to display first question');
    } catch (error) {
      console.error('Failed to start quiz session:', error);
    }
  }, [recommendedCountries, generateQuestions, mode, questionCount, timePerQuestion]);

  // Submit answer with enhanced tracking
  const submitAnswer = useCallback(async (answer: string) => {
    if (!quizState.currentQuestionData || !quizState.currentCountry) return;

    const isCorrect = answer === quizState.currentQuestionData.correctAnswer;
    const responseTime = quizState.questionStartTime ? Date.now() - quizState.questionStartTime : 0;
    
    // Update user progress with detailed metrics
    await updateProgressMutation.mutateAsync({
      countryCode: quizState.currentCountry.code,
      isCorrect,
      responseTime,
    });

    const newScore = quizState.score + (isCorrect ? 1 : 0);
    const nextQuestion = quizState.currentQuestion + 1;
    
    setQuizState(prev => ({
      ...prev,
      selectedAnswer: answer,
      showResult: true,
      score: newScore,
    }));

    // Auto advance after showing result
    setTimeout(() => {
      if (nextQuestion >= quizState.totalQuestions) {
        // Quiz complete
        setQuizState(prev => ({
          ...prev,
          isComplete: true,
          currentQuestionData: null,
        }));

        // Update session as completed
        if (quizState.sessionId) {
          fetch(`/api/quiz/${quizState.sessionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questionsCorrect: newScore,
              completed: true,
              completedAt: new Date().toISOString(),
            }),
            credentials: 'include'
          });
        }
      } else {
        // Next question
        const nextQuestionData = quizState.questions[nextQuestion];
        const nextCountry = recommendedCountries?.find(c => 
          c.name === nextQuestionData?.country || c.capital === nextQuestionData?.capital
        );

        setQuizState(prev => ({
          ...prev,
          currentQuestion: nextQuestion,
          currentQuestionData: nextQuestionData,
          currentCountry: nextCountry || null,
          timeRemaining: timePerQuestion,
          selectedAnswer: null,
          showResult: false,
          questionStartTime: Date.now(),
        }));
      }
    }, 2000);
  }, [quizState, updateProgressMutation, recommendedCountries, timePerQuestion]);

  // Timer effect
  useEffect(() => {
    if (quizState.timeRemaining <= 0 || quizState.showResult || quizState.isComplete) {
      return;
    }

    const timer = setInterval(() => {
      setQuizState(prev => {
        if (prev.timeRemaining <= 1) {
          // Time's up - submit empty answer
          submitAnswer('');
          return prev;
        }
        return {
          ...prev,
          timeRemaining: prev.timeRemaining - 1,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizState.timeRemaining, quizState.showResult, quizState.isComplete, submitAnswer]);

  // Reset quiz
  const resetQuiz = useCallback(() => {
    setQuizState({
      sessionId: null,
      currentQuestion: 0,
      totalQuestions: questionCount,
      score: 0,
      questions: [],
      currentQuestionData: null,
      timeRemaining: timePerQuestion,
      isComplete: false,
      selectedAnswer: null,
      showResult: false,
      currentCountry: null,
      questionStartTime: null,
    });
  }, [questionCount, timePerQuestion]);

  // Clean up debugging when data loads successfully
  useEffect(() => {
    if (recommendedCountries && recommendedCountries.length > 0) {
      console.log(`Smart Quiz ready: ${recommendedCountries.length} countries loaded for ${difficultyLevel} mode`);
    }
  }, [recommendedCountries, difficultyLevel]);

  return {
    ...quizState,
    startQuiz,
    submitAnswer,
    resetQuiz,
    isLoadingRecommendations,
    canStart: !isLoadingRecommendations && recommendedCountries && recommendedCountries.length > 0,
    difficultyLevel,
    recommendedCountriesCount: recommendedCountries?.length || 0,
  };
}