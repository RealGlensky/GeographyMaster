import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { X, CheckCircle, XCircle, MapPin, Globe, Timer, RotateCcw, Home } from "lucide-react";
import { Difficulty, Country, User } from "@shared/schema";
import { getCountriesByDifficulty, getAvailableCountries } from "@/data/countries";
import { CountryFlag } from "@/components/country-flag";
import { PronunciationButton } from "@/components/pronunciation-button";
import { GoogleMapsWorld } from "@/components/google-maps-world";
import { LeafletWorldMap } from "@/components/leaflet-world-map";
import { apiRequest } from "@/lib/queryClient";
import { formatTime, isTypingCorrect } from "@/lib/utils";

interface MapState {
  sessionId: number | null;
  currentQuestion: number;
  totalQuestions: number;
  score: number;
  timeRemaining: number;
  gameStarted: boolean;
  sessionComplete: boolean;
  questionStartTime: number | null;
}

interface MapQuestion {
  country: Country;
  type: 'locate-country' | 'name-capital';
  questionText: string;
  correctAnswer: string;
  stage: 'location' | 'capital'; // Two-stage questions
  locationCorrect?: boolean; // Track if location was correct
}

// Move this function outside component to prevent re-creation and infinite re-renders
const generateMapQuestions = (countries: Country[], count: number): MapQuestion[] => {
  const shuffled = [...countries].sort(() => Math.random() - 0.5);
  const selectedCountries = shuffled.slice(0, count);
  
  // All questions are now two-stage: locate country first, then name capital
  return selectedCountries.map(country => ({
    country,
    type: 'locate-country' as const,
    questionText: `Click on ${country.name} on the map`,
    correctAnswer: country.code,
    stage: 'location' as const,
  }));
};

export default function MapChallenge() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [urlParams] = useState(() => new URLSearchParams(window.location.search));
  const difficulty = (urlParams.get("difficulty") || "beginner") as Difficulty;
  
  // Get user data for excluded countries
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });
  
  const [countries, setCountries] = useState<Country[]>([]); // Countries for questions
  const [clickableCountries, setClickableCountries] = useState<Country[]>([]); // Countries that can be clicked on map
  const [questions, setQuestions] = useState<MapQuestion[]>([]);
  const [userAnswer, setUserAnswer] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [locationStageComplete, setLocationStageComplete] = useState(false);
  const [locationWasCorrect, setLocationWasCorrect] = useState(false);
  const [useGoogleMaps, setUseGoogleMaps] = useState(true);
  const [mapDifficulty, setMapDifficulty] = useState<'guided' | 'intermediate' | 'expert'>('guided');
  const [showDifficultySelector, setShowDifficultySelector] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [mapState, setMapState] = useState<MapState>({
    sessionId: null,
    currentQuestion: 0,
    totalQuestions: 15,
    score: 0,
    timeRemaining: 45,
    gameStarted: false,
    sessionComplete: false,
    questionStartTime: null,
  });
  
  const currentQuestion = questions[mapState.currentQuestion];
  const progressPercentage = (mapState.currentQuestion / mapState.totalQuestions) * 100;

  // Initialize countries when user data loads
  useEffect(() => {
    const excludedCountries = user?.excludedCountries || [];
    const availableCountries = getCountriesByDifficulty(difficulty, excludedCountries);
    setCountries(availableCountries);
  }, [user, difficulty]);

  // Set clickable countries based on map difficulty
  useEffect(() => {
    const excludedCountries = user?.excludedCountries || [];
    
    if (mapDifficulty === 'expert') {
      // Expert mode: Allow clicking ANY country on the map
      const allCountries = getAvailableCountries(excludedCountries);
      setClickableCountries(allCountries);
    } else {
      // Guided and Intermediate modes: Only allow clicking countries from the current difficulty level
      const levelCountries = getCountriesByDifficulty(difficulty, excludedCountries);
      setClickableCountries(levelCountries);
    }
  }, [user, difficulty, mapDifficulty]);

  // Generate questions when countries are loaded
  useEffect(() => {
    if (countries.length > 0) {
      const generatedQuestions = generateMapQuestions(countries, mapState.totalQuestions);
      setQuestions(generatedQuestions);
    }
  }, [countries]); // Remove mapState.totalQuestions to prevent infinite re-renders

  const startQuizMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/quiz/start", {
        mode: "map-challenge",
        difficulty,
        questionsAsked: mapState.totalQuestions,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      // Regenerate questions to ensure fresh set
      if (countries.length > 0) {
        const freshQuestions = generateMapQuestions(countries, mapState.totalQuestions);
        setQuestions(freshQuestions);
        console.log('New game started - Questions generated:', freshQuestions.length);
      }
      
      setMapState(prev => ({
        ...prev,
        sessionId: data.sessionId,
        gameStarted: true,
        questionStartTime: Date.now(),
        currentQuestion: 0, // Reset to first question
      }));
    },
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async ({ answer, responseTime, countryCode, correct }: { answer: string; responseTime: number; countryCode?: string; correct?: boolean }) => {
      if (!mapState.sessionId) throw new Error("No session");
      
      const response = await apiRequest("POST", `/api/quiz/${mapState.sessionId}/answer`, {
        questionId: mapState.currentQuestion.toString(),
        answer,
        responseTime,
        countryCode,
        correct,
      });
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate user stats to update progress
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/progress"] });
    },
  });

  // Memoized handlers to prevent infinite re-renders
  const proceedToNextQuestion = useCallback(() => {
    // Use refs to get latest values and avoid stale closures
    const latestMapState = mapStateRef.current;
    
    if (latestMapState.currentQuestion < latestMapState.totalQuestions - 1) {
      const nextQuestionIndex = latestMapState.currentQuestion + 1;
      console.log(`Moving to Q${nextQuestionIndex + 1}: ${questions[nextQuestionIndex]?.country.name} (${questions[nextQuestionIndex]?.correctAnswer})`);
      
      // Reset all stage states first
      setIsAnswered(false);
      setIsCorrect(false);
      setShowResult(false);
      setSelectedCountry(null);
      setUserAnswer("");
      setLocationStageComplete(false);
      setLocationWasCorrect(false);
      
      // Then update the question state
      setMapState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
        timeRemaining: 45,
        questionStartTime: Date.now(),
      }));
    } else {
      setMapState(prev => ({ ...prev, sessionComplete: true }));
    }
  }, [questions]); // Only dependency is questions array

  const handleTimeUp = useCallback(() => {
    // Use refs to get latest values and avoid stale closures
    const latestIsAnswered = isAnsweredRef.current;
    const latestMapState = mapStateRef.current;
    
    if (latestIsAnswered) return;
    
    setIsAnswered(true);
    setIsCorrect(false);
    setShowResult(true);
    
    // Submit empty answer for time up
    const responseTime = latestMapState.questionStartTime ? Date.now() - latestMapState.questionStartTime : 45000;
    submitAnswerMutation.mutate({ answer: "", responseTime });
    
    setTimeout(() => {
      proceedToNextQuestion();
    }, 2000);
  }, [submitAnswerMutation, proceedToNextQuestion]); // Only necessary dependencies

  // Timer effect
  useEffect(() => {
    if (mapState.gameStarted && !mapState.sessionComplete && mapState.timeRemaining > 0 && !isAnswered) {
      const timer = setTimeout(() => {
        setMapState(prev => ({ ...prev, timeRemaining: prev.timeRemaining - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (mapState.timeRemaining === 0 && !isAnswered) {
      handleTimeUp();
    }
  }, [mapState.timeRemaining, mapState.gameStarted, mapState.sessionComplete, isAnswered, handleTimeUp]);

  // Focus input when new question starts
  useEffect(() => {
    if (currentQuestion?.type === 'name-capital' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mapState.currentQuestion, currentQuestion]);

  const handleClose = () => {
    setLocation("/");
  };

  const handleStartGame = () => {
    // Reset all state before starting
    setIsAnswered(false);
    setIsCorrect(false);
    setShowResult(false);
    setSelectedCountry(null);
    setUserAnswer("");
    setLocationStageComplete(false);
    setLocationWasCorrect(false);
    
    startQuizMutation.mutate();
  };

  // Use refs to always get the latest state without dependency issues
  const currentQuestionRef = useRef<MapQuestion | undefined>();
  const currentQuestionIndexRef = useRef<number>(0);
  const locationStageCompleteRef = useRef<boolean>(false);
  const isAnsweredRef = useRef<boolean>(false);
  const userAnswerRef = useRef<string>("");
  const selectedCountryRef = useRef<string | null>(null);
  const locationWasCorrectRef = useRef<boolean>(false);
  const mapStateRef = useRef<MapState>(mapState);

  // Update refs whenever state changes
  useEffect(() => {
    currentQuestionRef.current = questions[mapState.currentQuestion];
    currentQuestionIndexRef.current = mapState.currentQuestion;
  }, [questions, mapState.currentQuestion]);

  useEffect(() => {
    locationStageCompleteRef.current = locationStageComplete;
  }, [locationStageComplete]);

  useEffect(() => {
    isAnsweredRef.current = isAnswered;
  }, [isAnswered]);

  useEffect(() => {
    userAnswerRef.current = userAnswer;
  }, [userAnswer]);

  useEffect(() => {
    selectedCountryRef.current = selectedCountry;
  }, [selectedCountry]);

  useEffect(() => {
    locationWasCorrectRef.current = locationWasCorrect;
  }, [locationWasCorrect]);

  useEffect(() => {
    mapStateRef.current = mapState;
  }, [mapState]);

  // Create a completely fresh handler that always uses current state
  const memoizedCountryClickHandler = useCallback((countryCode: string) => {
    // Always get the latest values from refs to avoid stale closures
    const latestQuestion = currentQuestionRef.current;
    const latestQuestionIndex = currentQuestionIndexRef.current;
    const isLocationComplete = locationStageCompleteRef.current;
    
    if (isLocationComplete || !latestQuestion) return;
    
    console.log(`Q${latestQuestionIndex + 1}: Clicked ${countryCode}, Expected ${latestQuestion.correctAnswer} (${latestQuestion.country.name})`);
    
    setSelectedCountry(countryCode);
    const correct = countryCode === latestQuestion.correctAnswer;
    setLocationWasCorrect(correct);
    setLocationStageComplete(true);
    setShowResult(true);
    
    // After 1.5 seconds, move to capital stage
    setTimeout(() => {
      setShowResult(false);
      // Focus on input for capital entry
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 1500);
  }, []); // Empty dependency array since we use refs for latest values

  const memoizedCountryHoverHandler = useCallback((countryCode: string | null) => {
    // Use ref to get latest values and avoid stale closures
    const latestLocationComplete = locationStageCompleteRef.current;
    if (!latestLocationComplete) {
      setHoveredCountry(countryCode);
    }
  }, []); // Empty dependency array since we use refs for latest values

  const handleAnswerSubmit = useCallback(() => {
    // Use refs to get latest values and avoid stale closures
    const latestLocationComplete = locationStageCompleteRef.current;
    const latestIsAnswered = isAnsweredRef.current;
    const latestUserAnswer = userAnswerRef.current;
    const latestCurrentQuestion = currentQuestionRef.current;
    const latestSelectedCountry = selectedCountryRef.current;
    const latestLocationWasCorrect = locationWasCorrectRef.current;
    const latestMapState = mapStateRef.current;
    
    if (!latestLocationComplete || latestIsAnswered || !latestUserAnswer.trim() || !latestCurrentQuestion) return;
    
    const capitalCorrect = isTypingCorrect(latestUserAnswer, latestCurrentQuestion.country.capital);
    setIsCorrect(capitalCorrect);
    setIsAnswered(true);
    setShowResult(true);
    
    // Score calculation: both stages must be correct for full point
    if (latestLocationWasCorrect && capitalCorrect) {
      setMapState(prev => ({ ...prev, score: prev.score + 1 }));
    }

    // Submit combined answer to backend
    const responseTime = latestMapState.questionStartTime ? Date.now() - latestMapState.questionStartTime : 0;
    const combinedAnswer = `${latestSelectedCountry}|${latestUserAnswer}`;
    const overallCorrect = latestLocationWasCorrect && capitalCorrect;
    submitAnswerMutation.mutate({ 
      answer: combinedAnswer, 
      responseTime,
      countryCode: latestCurrentQuestion.country.code,
      correct: overallCorrect
    });
    
    setTimeout(() => {
      proceedToNextQuestion();
    }, 2500);
  }, [submitAnswerMutation]); // Only dependency is the mutation function



  const handleRestart = () => {
    setMapState({
      sessionId: null,
      currentQuestion: 0,
      totalQuestions: 15,
      score: 0,
      timeRemaining: 45,
      gameStarted: false,
      sessionComplete: false,
      questionStartTime: null,
    });
    setIsAnswered(false);
    setIsCorrect(false);
    setShowResult(false);
    setSelectedCountry(null);
    setUserAnswer("");
    setLocationStageComplete(false);
    setLocationWasCorrect(false);
    
    // Generate new questions
    const generatedQuestions = generateMapQuestions(countries, 15);
    setQuestions(generatedQuestions);
  };

  // Difficulty selector screen
  if (showDifficultySelector) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          
          <Card className="max-w-3xl mx-auto">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <Globe className="w-16 h-16 text-primary mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Map Challenge Setup</h1>
                <p className="text-lg text-gray-600">Choose your map visualization difficulty</p>
              </div>
              
              <div className="grid gap-6 mb-8">
                {/* Guided Mode */}
                <div 
                  className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                    mapDifficulty === 'guided' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setMapDifficulty('guided')}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">🎯 Guided Mode</h4>
                      <p className="text-gray-600">
                        Country markers are always visible - Perfect for learning geography and getting familiar with country locations
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Easier</Badge>
                  </div>
                </div>

                {/* Intermediate Mode */}
                <div 
                  className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                    mapDifficulty === 'intermediate' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setMapDifficulty('intermediate')}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">🎲 Intermediate Mode</h4>
                      <p className="text-gray-600">
                        Markers appear only on hover - Explore the map to discover countries with subtle visual hints
                      </p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                  </div>
                </div>

                {/* Expert Mode */}
                <div 
                  className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                    mapDifficulty === 'expert' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setMapDifficulty('expert')}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">🌍 Expert Mode</h4>
                      <p className="text-gray-600">
                        No markers, hints, or country labels - Pure geography knowledge test using only country borders and shapes
                      </p>
                    </div>
                    <Badge className="bg-red-100 text-red-800">Hardest</Badge>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-gray-600 mb-6">
                  Geography Level: <Badge variant="outline" className="ml-2 capitalize">{difficulty}</Badge>
                </p>
                
                <Button 
                  onClick={() => setShowDifficultySelector(false)} 
                  size="lg" 
                  className="text-lg px-8 py-4"
                >
                  Continue with {mapDifficulty.charAt(0).toUpperCase() + mapDifficulty.slice(1)} Mode
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Loading state
  if (countries.length === 0 || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing your map challenge...</p>
        </div>
      </div>
    );
  }

  // Game start screen
  if (!mapState.gameStarted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <Globe className="w-20 h-20 text-primary mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Map Challenge</h1>
                <Badge variant="outline" className="text-lg px-4 py-2 capitalize">{difficulty} Level</Badge>
              </div>
              
              <p className="text-lg text-gray-600 mb-8">
                Test your geography knowledge with interactive world map challenges. 
                You'll need to locate countries and name their capitals!
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 rounded-lg p-4">
                  <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900 mb-1">Find Countries</h3>
                  <p className="text-sm text-gray-600">Click on countries when prompted</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <Globe className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900 mb-1">Name Capitals</h3>
                  <p className="text-sm text-gray-600">Type capital city names</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <Timer className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900 mb-1">Beat the Clock</h3>
                  <p className="text-sm text-gray-600">45 seconds per question</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-8">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Questions:</span>
                  <span className="font-medium">{mapState.totalQuestions}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Time per question:</span>
                  <span className="font-medium">45 seconds</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Countries available:</span>
                  <span className="font-medium">{countries.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Map mode:</span>
                  <Badge variant="outline" className="capitalize">{mapDifficulty}</Badge>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={handleStartGame} 
                  size="lg" 
                  className="w-full text-lg px-8 py-4"
                  disabled={startQuizMutation.isPending}
                >
                  {startQuizMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Starting...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-5 h-5 mr-2" />
                      Start Map Challenge
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => setShowDifficultySelector(true)} 
                  className="w-full"
                  disabled={startQuizMutation.isPending}
                >
                  Change Map Difficulty
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Session complete screen
  if (mapState.sessionComplete) {
    const accuracy = Math.round((mapState.score / mapState.totalQuestions) * 100);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              {accuracy >= 80 ? (
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              ) : accuracy >= 60 ? (
                <Globe className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              ) : (
                <XCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              )}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Map Challenge Complete!</h2>
              <p className="text-gray-600">You scored {mapState.score} out of {mapState.totalQuestions}</p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Accuracy</span>
                <span className="font-semibold">{accuracy}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Difficulty</span>
                <Badge variant="secondary" className="capitalize">{difficulty}</Badge>
              </div>
            </div>
            
            {accuracy >= 80 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 font-medium">Excellent work! You're mastering world geography!</p>
              </div>
            )}
            
            <div className="flex gap-3">
              <Button onClick={handleRestart} className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button variant="outline" onClick={handleClose} className="flex-1">
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Game interface
  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4 mr-2" />
              Exit
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Map Challenge</h1>
              <p className="text-gray-600 capitalize">{difficulty} Level</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-lg px-3 py-1">
              {mapState.currentQuestion + 1} / {mapState.totalQuestions}
            </Badge>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              <Timer className="w-4 h-4 mr-1" />
              {formatTime(mapState.timeRemaining)}
            </Badge>
            <Badge className="text-lg px-3 py-1">
              Score: {mapState.score}
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={progressPercentage} className="h-3" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Map Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Interactive World Map</h3>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={useGoogleMaps ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUseGoogleMaps(true)}
                      className="text-xs"
                    >
                      Google Maps
                    </Button>
                    <Button
                      variant={!useGoogleMaps ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUseGoogleMaps(false)}
                      className="text-xs"
                    >
                      OpenStreetMap
                    </Button>
                    <Globe className="w-5 h-5 text-gray-500" />
                  </div>
                </div>
                
                {/* Map Component - Switch between Google Maps and OpenStreetMap */}
                {useGoogleMaps ? (
                  <GoogleMapsWorld
                    countries={clickableCountries}
                    selectedCountry={selectedCountry}
                    hoveredCountry={hoveredCountry}
                    targetCountry={currentQuestion?.country.code}
                    showResult={showResult}
                    isCorrect={locationWasCorrect}
                    markerVisibility={
                      mapDifficulty === 'guided' ? 'always' : 
                      mapDifficulty === 'intermediate' ? 'hover' : 'never'
                    }
                    hideLabels={mapDifficulty === 'expert'}
                    onCountryClick={memoizedCountryClickHandler}
                    onCountryHover={memoizedCountryHoverHandler}
                  />
                ) : (
                  <LeafletWorldMap
                    countries={clickableCountries}
                    selectedCountry={selectedCountry}
                    hoveredCountry={hoveredCountry}
                    targetCountry={currentQuestion?.country.code}
                    showResult={showResult}
                    isCorrect={locationWasCorrect}
                    markerVisibility={
                      mapDifficulty === 'guided' ? 'always' : 
                      mapDifficulty === 'intermediate' ? 'hover' : 'never'
                    }
                    hideLabels={mapDifficulty === 'expert'}
                    onCountryClick={memoizedCountryClickHandler}
                    onCountryHover={memoizedCountryHoverHandler}
                  />
                )}
                
                {/* Hint overlay for locate questions */}
                {!locationStageComplete && currentQuestion && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg p-3 shadow-lg border z-10">
                    <p className="text-sm text-gray-600">
                      Click on <span className="font-semibold text-gray-900">{currentQuestion.country.name}</span> on the map
                    </p>
                  </div>
                )}
                
                {/* Country name reveal in bottom corner (only after clicking) */}
                {selectedCountry && locationStageComplete && hoveredCountry && (
                  <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-lg border z-10">
                    <p className="text-sm font-medium text-gray-900">
                      {countries.find(c => c.code === hoveredCountry)?.name || hoveredCountry}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Question Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Question */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Question {mapState.currentQuestion + 1}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Timer className="w-4 h-4 text-gray-500" />
                    <span className={`font-mono text-lg ${
                      mapState.timeRemaining <= 10 ? 'text-red-600' : 'text-gray-700'
                    }`}>
                      {formatTime(mapState.timeRemaining)}
                    </span>
                  </div>
                </div>
                
                {currentQuestion && (
                  <div className="space-y-4">
                    {!locationStageComplete ? (
                      // Stage 1: Locate Country
                      <div className="text-center">
                        <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                        <h4 className="text-xl font-bold text-gray-900 mb-2">
                          Find: {currentQuestion.country.name}
                        </h4>
                        <div className="flex items-center justify-center space-x-2 mb-4">
                          <CountryFlag 
                            countryCode={currentQuestion.country.code} 
                            countryName={currentQuestion.country.name}
                          />
                          <Badge variant="outline">{currentQuestion.country.continent}</Badge>
                        </div>
                        <p className="text-gray-600 mb-4">
                          Click on {currentQuestion.country.name} on the map above
                        </p>
                        <PronunciationButton 
                          text={currentQuestion.country.name} 
                          className="mx-auto"
                        />
                      </div>
                    ) : (
                      // Stage 2: Name Capital
                      <div>
                        <div className="text-center mb-6">
                          <Globe className="w-12 h-12 text-green-600 mx-auto mb-4" />
                          <h4 className="text-xl font-bold text-gray-900 mb-2">
                            Name the Capital
                          </h4>
                          {/* Show location result */}
                          <div className="mb-4 p-3 rounded-lg bg-gray-50">
                            <div className="flex items-center justify-center space-x-2">
                              {locationWasCorrect ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )}
                              <span className={locationWasCorrect ? "text-green-600" : "text-red-600"}>
                                Location: {locationWasCorrect ? "Correct" : "Incorrect"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-center space-x-2 mb-4">
                            <CountryFlag 
                              countryCode={currentQuestion.country.code} 
                              countryName={currentQuestion.country.name}
                            />
                            <span className="text-lg font-medium">{currentQuestion.country.name}</span>
                          </div>
                          <PronunciationButton 
                            text={currentQuestion.country.name} 
                            className="mx-auto mb-4"
                          />
                        </div>
                        
                        <div className="space-y-4">
                          <Input
                            ref={inputRef}
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            placeholder="Type the capital city name..."
                            className={isAnswered 
                              ? isCorrect 
                                ? "border-green-500 bg-green-50" 
                                : "border-red-500 bg-red-50"
                              : ""
                            }
                            disabled={isAnswered}
                            onKeyPress={(e) => e.key === "Enter" && handleAnswerSubmit()}
                          />
                          
                          <Button 
                            onClick={handleAnswerSubmit}
                            className="w-full"
                            disabled={isAnswered || !userAnswer.trim()}
                          >
                            Submit Answer
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Result Feedback */}
            {showResult && (
              <Card className={
                // Use appropriate correctness variable based on stage
                (isAnswered ? isCorrect : locationWasCorrect) 
                  ? "border-green-500 bg-green-50" 
                  : "border-red-500 bg-red-50"
              }>
                <CardContent className="p-6 text-center">
                  {/* Use appropriate correctness variable based on stage */}
                  {(isAnswered ? isCorrect : locationWasCorrect) ? (
                    <div className="text-green-600">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3" />
                      <h4 className="text-lg font-bold mb-2">Excellent!</h4>
                      <p>You got it right!</p>
                    </div>
                  ) : (
                    <div className="text-red-600">
                      <XCircle className="w-12 h-12 mx-auto mb-3" />
                      <h4 className="text-lg font-bold mb-2">Not quite!</h4>
                      
                      {/* Show what country was actually clicked (for location stage) */}
                      {selectedCountry && locationStageComplete && !locationWasCorrect && !isAnswered && (
                        <div className="mt-3">
                          <p className="text-sm text-red-500">
                            That was {clickableCountries.find(c => c.code === selectedCountry)?.name || selectedCountry}
                          </p>
                        </div>
                      )}
                      
                      {/* Show correct answer for capital questions */}
                      {isAnswered && !isCorrect && (
                        <div className="mt-3 p-3 bg-white rounded-lg">
                          <p className="text-sm text-gray-600">Correct answer:</p>
                          <p className="font-bold text-gray-900">{currentQuestion?.country.capital}</p>
                          <PronunciationButton 
                            text={currentQuestion?.country.capital || ""} 
                            className="mt-2"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Game Stats */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{mapState.score}</div>
                    <div className="text-sm text-gray-600">Correct</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-700">
                      {Math.round((mapState.score / (mapState.currentQuestion + (isAnswered ? 1 : 0))) * 100) || 0}%
                    </div>
                    <div className="text-sm text-gray-600">Accuracy</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );


}
