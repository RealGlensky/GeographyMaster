import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QuizQuestion, Country, StudyMode, Difficulty, User } from "@shared/schema";
import { countries, getCountriesByDifficulty } from "@/data/countries";
import { generateQuizOptions, shuffleArray } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface QuizState {
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
}

interface UseQuizOptions {
  mode: StudyMode;
  difficulty: Difficulty;
  questionCount?: number;
  timePerQuestion?: number;
}

export function useQuiz({ mode, difficulty, questionCount = 10, timePerQuestion = 30 }: UseQuizOptions) {
  const queryClient = useQueryClient();
  
  // Get user data for excluded countries
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });
  
  const [quizState, setQuizState] = useState<QuizState>({
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
  });

  // Apply weighted selection based on recently seen and focus countries
  const applyWeightedSelection = useCallback((countries: Country[]): Country[] => {
    const recentlySeen = user?.recentlySeenCountries || [];
    const focusCountries = user?.focusCountries || [];
    
    // Create weighted array
    const weightedCountries: Country[] = [];
    
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

  // Generate questions based on difficulty
  const generateQuestions = useCallback((countries: Country[]): QuizQuestion[] => {
    const weightedCountries = applyWeightedSelection(countries);
    const selectedCountries = weightedCountries.slice(0, questionCount);
    const allCapitals = countries.map(c => c.capital);
    const allCountryNames = countries.map(c => c.name);

    return selectedCountries.map((country, index) => {
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
  }, [questionCount, applyWeightedSelection]);

  // Start quiz mutation
  const startQuizMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/quiz/start", {
        mode,
        difficulty,
        questionsAsked: questionCount,
      });
      return await response.json();
    },
    onSuccess: (session) => {
      const excludedCountries = user?.excludedCountries || [];
      const availableCountries = getCountriesByDifficulty(difficulty, excludedCountries);
      const questions = generateQuestions(availableCountries);
      
      setQuizState(prev => ({
        ...prev,
        sessionId: session.id,
        questions,
        currentQuestionData: questions[0] || null,
        currentQuestion: 1,
        timeRemaining: timePerQuestion,
      }));
    },
  });

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async ({ answer, countryCode }: { answer: string; countryCode: string }) => {
      const isCorrect = answer === quizState.currentQuestionData?.correctAnswer;
      
      if (quizState.sessionId) {
        await apiRequest("POST", `/api/quiz/${quizState.sessionId}/answer`, {
          countryCode,
          correct: isCorrect,
        });
      }
      
      return { isCorrect };
    },
    onSuccess: ({ isCorrect }) => {
      setQuizState(prev => {
        const nextQuestionIndex = prev.currentQuestion;
        const isLastQuestion = nextQuestionIndex >= prev.totalQuestions;
        
        return {
          ...prev,
          score: isCorrect ? prev.score + 1 : prev.score,
          showResult: true,
          // Immediately update question count to keep it in sync with score
          currentQuestion: isLastQuestion ? prev.currentQuestion : nextQuestionIndex + 1,
        };
      });

      // Auto-advance after showing result
      setTimeout(() => {
        nextQuestion();
      }, 2000);
    },
  });

  // Timer effect
  useEffect(() => {
    if (quizState.timeRemaining > 0 && !quizState.showResult && !quizState.isComplete) {
      const timer = setTimeout(() => {
        setQuizState(prev => ({ ...prev, timeRemaining: prev.timeRemaining - 1 }));
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (quizState.timeRemaining === 0 && !quizState.showResult) {
      // Time's up, submit empty answer
      const currentCountry = countries.find(c => 
        c.name === quizState.currentQuestionData?.country || 
        c.capital === quizState.currentQuestionData?.capital
      );
      
      if (currentCountry) {
        submitAnswerMutation.mutate({ answer: "", countryCode: currentCountry.code });
      }
    }
  }, [quizState.timeRemaining, quizState.showResult, quizState.isComplete]);

  const startQuiz = useCallback(() => {
    startQuizMutation.mutate();
  }, []);

  const submitAnswer = useCallback((answer: string) => {
    if (quizState.showResult || !quizState.currentQuestionData) return;
    
    // Store the user's selected answer immediately
    setQuizState(prev => ({
      ...prev,
      selectedAnswer: answer,
    }));
    
    const currentCountry = countries.find(c => 
      c.name === quizState.currentQuestionData?.country || 
      c.capital === quizState.currentQuestionData?.capital
    );
    
    if (currentCountry) {
      submitAnswerMutation.mutate({ answer, countryCode: currentCountry.code });
    }
  }, [quizState.currentQuestionData, quizState.showResult]);

  const nextQuestion = useCallback(() => {
    setQuizState(prev => {
      const nextQuestionIndex = prev.currentQuestion - 1; // Adjust since currentQuestion is already incremented
      const isLastQuestion = prev.currentQuestion >= prev.totalQuestions;
      
      if (isLastQuestion) {
        // Complete the quiz
        if (prev.sessionId) {
          apiRequest("PATCH", `/api/quiz/${prev.sessionId}`, {
            questionsCorrect: prev.score,
            completed: true,
          });
        }
        
        // Update recently seen countries
        const seenCountryCodes = prev.questions.map(q => {
          const country = countries.find(c => c.name === q.country || c.capital === q.capital);
          return country?.code;
        }).filter((code): code is string => code !== undefined);
        
        const currentRecentlySeen = user?.recentlySeenCountries || [];
        const updatedRecentlySeen = [...currentRecentlySeen, ...seenCountryCodes].slice(-15);
        
        apiRequest("POST", "/api/user/recently-seen", {
          countryCodes: updatedRecentlySeen
        });
        
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/user/progress"] });
        
        return {
          ...prev,
          isComplete: true,
          showResult: false,
        };
      }
      
      return {
        ...prev,
        currentQuestionData: prev.questions[nextQuestionIndex + 1] || null,
        timeRemaining: timePerQuestion,
        selectedAnswer: null,
        showResult: false,
      };
    });
  }, [timePerQuestion, queryClient, user]);

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
    });
  }, [questionCount, timePerQuestion]);

  return {
    ...quizState,
    startQuiz,
    submitAnswer,
    nextQuestion,
    resetQuiz,
    isLoading: startQuizMutation.isPending,
    isSubmitting: submitAnswerMutation.isPending,
  };
}
