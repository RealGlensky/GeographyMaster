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
import { generateQuizOptions, shuffleArray, isTypingCorrect } from "@/lib/utils";
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
  quizMode?: 'multiple-choice' | 'typing';
}

export function useDynamicQuiz({ 
  mode, 
  difficultyLevel, 
  questionCount = 20, 
  timePerQuestion = 30,
  quizMode = 'multiple-choice'
}: UseDynamicQuizOptions) {
  const queryClient = useQueryClient();
  
  // Get user data
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  // Get AI-powered recommended countries based on user progress and selected difficulty level
  const { data: recommendedCountries, isLoading: isLoadingCountries, error } = useQuery({
    queryKey: ['/api/user/recommended-countries', difficultyLevel],
    queryFn: async () => {
      const response = await fetch(`/api/user/recommended-countries?level=${difficultyLevel}&count=20`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json() as CountryWithDynamicDifficulty[];
      return result;
    },
    staleTime: 30000,
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

  // Apply weighted selection based on recently seen and focus countries
  const applyWeightedSelection = useCallback((countries: CountryWithDynamicDifficulty[]): CountryWithDynamicDifficulty[] => {
    const recentlySeen = user?.recentlySeenCountries || [];
    const focusCountries = user?.focusCountries || [];
    
    // Create weighted array
    const weightedCountries: CountryWithDynamicDifficulty[] = [];
    
    for (const country of countries) {
      const isRecentlySeen = recentlySeen.includes(country.code);
      const isFocus = focusCountries.includes(country.code);
      
      if (isFocus) {
        // Focus countries: 5x weight (5 copies)
        for (let i = 0; i < 5; i++) {
          weightedCountries.push(country);
        }
      } else if (isRecentlySeen) {
        // Recently seen: 0.2x weight (skip 80% of the time, add 20%)
        if (Math.random() < 0.2) {
          weightedCountries.push(country);
        }
      } else {
        // Normal countries: 1x weight (1 copy)
        weightedCountries.push(country);
      }
    }
    
    return shuffleArray(weightedCountries);
  }, [user]);

  // Generate questions from recommended countries
  const generateQuestions = useCallback((countries: CountryWithDynamicDifficulty[], quizMode: 'multiple-choice' | 'typing' = 'multiple-choice'): QuizQuestion[] => {
    if (!countries || countries.length === 0) return [];
    
    const weightedCountries = applyWeightedSelection(countries);
    const selectedCountries = weightedCountries.slice(0, questionCount);
    const allCapitals = countries.map(c => c.capital);
    const allCountryNames = countries.map(c => c.name);

    return selectedCountries.map((country, index) => {
      const isCountryToCapital = Math.random() > 0.5;
      
      if (isCountryToCapital) {
        // Ensure we have at least 4 unique options for multiple choice
        const options = quizMode === 'multiple-choice' ? 
          generateQuizOptions(country.capital, allCapitals).slice(0, 4) : [];
        return {
          id: `${index}`,
          type: 'country-to-capital' as const,
          country: country.name,
          capital: country.capital,
          options: options,
          correctAnswer: country.capital,
        };
      } else {
        // Ensure we have at least 4 unique options for multiple choice
        const options = quizMode === 'multiple-choice' ? 
          generateQuizOptions(country.name, allCountryNames).slice(0, 4) : [];
        return {
          id: `${index}`,
          type: 'capital-to-country' as const,
          country: country.name,
          capital: country.capital,
          options: options,
          correctAnswer: country.name,
        };
      }
    });
  }, [questionCount, applyWeightedSelection]);

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
      console.error('Cannot start quiz: No countries available for this difficulty level');
      return;
    }

    // Use AI-recommended countries for questions
    const questions = generateQuestions(recommendedCountries, quizMode);
    console.log(`Starting quiz with ${questions.length} AI-recommended questions from ${recommendedCountries.length} countries in ${difficultyLevel} mode (${quizMode})`);
    
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
  }, [recommendedCountries, generateQuestions, mode, questionCount, timePerQuestion, quizMode, difficultyLevel]);

  // Submit answer with enhanced tracking
  const submitAnswer = useCallback(async (answer: string) => {
    if (!quizState.currentQuestionData || !quizState.currentCountry) return;

    // For typing mode, use fuzzy matching for correctness
    const isCorrect = quizMode === 'typing' 
      ? isTypingCorrect(answer, quizState.currentQuestionData.correctAnswer)
      : answer === quizState.currentQuestionData.correctAnswer;
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
        
        // Update recently seen countries
        const seenCountryCodes = quizState.questions.map((q: QuizQuestion) => {
          const country = recommendedCountries?.find(c => c.name === q.country || c.capital === q.capital);
          return country?.code;
        }).filter((code: string | undefined): code is string => code !== undefined);
        
        const currentRecentlySeen = user?.recentlySeenCountries || [];
        const updatedRecentlySeen = [...currentRecentlySeen, ...seenCountryCodes].slice(-15);
        
        apiRequest("POST", "/api/user/recently-seen", {
          countryCodes: updatedRecentlySeen
        });
        
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
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
  }, [quizState, updateProgressMutation, recommendedCountries, timePerQuestion, user, queryClient, quizMode]);

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
      console.log(`Quiz ready: ${recommendedCountries.length} AI-recommended countries loaded for ${difficultyLevel} mode`);
    }
  }, [recommendedCountries, difficultyLevel]);

  return {
    ...quizState,
    startQuiz,
    submitAnswer,
    resetQuiz,
    isLoadingCountries,
    canStart: !isLoadingCountries && recommendedCountries && recommendedCountries.length > 0,
    difficultyLevel,
    recommendedCountriesCount: recommendedCountries?.length || 0,
  };
}