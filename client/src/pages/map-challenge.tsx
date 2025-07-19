import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { X, CheckCircle, XCircle, MapPin, Globe, Timer, RotateCcw, Home } from "lucide-react";
import { Difficulty, Country, User } from "@shared/schema";
import { getCountriesByDifficulty } from "@/data/countries";
import { CountryFlag } from "@/components/country-flag";
import { PronunciationButton } from "@/components/pronunciation-button";
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
}

export default function MapChallenge() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [urlParams] = useState(() => new URLSearchParams(window.location.search));
  const difficulty = (urlParams.get("difficulty") || "beginner") as Difficulty;
  
  // Get user data for excluded countries
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });
  
  const [countries, setCountries] = useState<Country[]>([]);
  const [questions, setQuestions] = useState<MapQuestion[]>([]);
  const [userAnswer, setUserAnswer] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
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

  // Generate questions when countries are loaded
  useEffect(() => {
    if (countries.length > 0) {
      const generatedQuestions = generateMapQuestions(countries, mapState.totalQuestions);
      setQuestions(generatedQuestions);
    }
  }, [countries, mapState.totalQuestions]);

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
  }, [mapState.timeRemaining, mapState.gameStarted, mapState.sessionComplete, isAnswered]);

  // Focus input when new question starts
  useEffect(() => {
    if (currentQuestion?.type === 'name-capital' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mapState.currentQuestion, currentQuestion]);

  const generateMapQuestions = (countries: Country[], count: number): MapQuestion[] => {
    const shuffled = [...countries].sort(() => Math.random() - 0.5);
    const selectedCountries = shuffled.slice(0, count);
    
    return selectedCountries.map(country => {
      const questionType = Math.random() > 0.5 ? 'locate-country' : 'name-capital';
      
      if (questionType === 'locate-country') {
        return {
          country,
          type: 'locate-country',
          questionText: `Click on ${country.name} on the map`,
          correctAnswer: country.code,
        };
      } else {
        return {
          country,
          type: 'name-capital',
          questionText: `What is the capital of ${country.name}?`,
          correctAnswer: country.capital,
        };
      }
    });
  };

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
      setMapState(prev => ({
        ...prev,
        sessionId: data.sessionId,
        gameStarted: true,
        questionStartTime: Date.now(),
      }));
    },
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async ({ answer, responseTime }: { answer: string; responseTime: number }) => {
      if (!mapState.sessionId) throw new Error("No session");
      
      const response = await apiRequest("POST", "/api/quiz/answer", {
        sessionId: mapState.sessionId,
        questionId: mapState.currentQuestion.toString(),
        answer,
        responseTime,
        isCorrect,
      });
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate user stats to update progress
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/progress"] });
    },
  });

  const handleClose = () => {
    setLocation("/");
  };

  const handleStartGame = () => {
    startQuizMutation.mutate();
  };

  const handleCountryClick = (countryCode: string) => {
    if (isAnswered || currentQuestion?.type !== 'locate-country') return;
    
    setSelectedCountry(countryCode);
    const correct = countryCode === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setIsAnswered(true);
    setShowResult(true);
    
    if (correct) {
      setMapState(prev => ({ ...prev, score: prev.score + 1 }));
    }

    // Submit answer to backend
    const responseTime = mapState.questionStartTime ? Date.now() - mapState.questionStartTime : 0;
    submitAnswerMutation.mutate({ answer: countryCode, responseTime });
    
    setTimeout(() => {
      proceedToNextQuestion();
    }, 2500);
  };

  const handleAnswerSubmit = () => {
    if (isAnswered || !userAnswer.trim() || currentQuestion?.type !== 'name-capital') return;
    
    const correct = isTypingCorrect(userAnswer, currentQuestion.correctAnswer);
    setIsCorrect(correct);
    setIsAnswered(true);
    setShowResult(true);
    
    if (correct) {
      setMapState(prev => ({ ...prev, score: prev.score + 1 }));
    }

    // Submit answer to backend
    const responseTime = mapState.questionStartTime ? Date.now() - mapState.questionStartTime : 0;
    submitAnswerMutation.mutate({ answer: userAnswer, responseTime });
    
    setTimeout(() => {
      proceedToNextQuestion();
    }, 2500);
  };

  const handleTimeUp = () => {
    if (isAnswered) return;
    
    setIsAnswered(true);
    setIsCorrect(false);
    setShowResult(true);
    
    // Submit empty answer for time up
    const responseTime = mapState.questionStartTime ? Date.now() - mapState.questionStartTime : 45000;
    submitAnswerMutation.mutate({ answer: "", responseTime });
    
    setTimeout(() => {
      proceedToNextQuestion();
    }, 2000);
  };

  const proceedToNextQuestion = () => {
    if (mapState.currentQuestion < mapState.totalQuestions - 1) {
      setMapState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
        timeRemaining: 45,
        questionStartTime: Date.now(),
      }));
      setIsAnswered(false);
      setIsCorrect(false);
      setShowResult(false);
      setSelectedCountry(null);
      setUserAnswer("");
    } else {
      setMapState(prev => ({ ...prev, sessionComplete: true }));
    }
  };

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
    
    // Generate new questions
    const generatedQuestions = generateMapQuestions(countries, 15);
    setQuestions(generatedQuestions);
  };

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
              </div>
              
              <Button 
                onClick={handleStartGame} 
                size="lg" 
                className="text-lg px-8 py-4"
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
                  <Globe className="w-5 h-5 text-gray-500" />
                </div>
                
                {/* Enhanced World Map */}
                <div className="relative bg-gradient-to-b from-blue-100 to-blue-50 rounded-lg border-2 border-blue-200 min-h-[500px] overflow-hidden">
                  <svg
                    viewBox="0 0 800 500"
                    className="w-full h-full"
                    onMouseLeave={() => setHoveredCountry(null)}
                  >
                    {/* Background ocean */}
                    <rect width="800" height="500" fill="#e0f2fe" />
                    
                    {/* Country regions - simplified world map representation */}
                    {countries.slice(0, 20).map((country, index) => {
                      const isTargetCountry = currentQuestion?.type === 'locate-country' && 
                                            currentQuestion.correctAnswer === country.code;
                      const isSelected = selectedCountry === country.code;
                      const isHovered = hoveredCountry === country.code;
                      
                      // Create varied country shapes and positions
                      const regions = generateCountryRegions(country, index, countries.length);
                      
                      let fillColor = "#d1d5db"; // default light gray
                      let strokeColor = "#9ca3af";
                      let strokeWidth = 1;
                      
                      if (showResult && isTargetCountry && isCorrect) {
                        fillColor = "#10b981"; // correct - green
                        strokeColor = "#059669";
                        strokeWidth = 3;
                      } else if (showResult && isSelected && !isCorrect) {
                        fillColor = "#ef4444"; // incorrect - red  
                        strokeColor = "#dc2626";
                        strokeWidth = 3;
                      } else if (isSelected) {
                        fillColor = "#3b82f6"; // selected - blue
                        strokeColor = "#2563eb";
                        strokeWidth = 2;
                      } else if (isHovered) {
                        fillColor = "#f3f4f6"; // hover - lighter gray
                        strokeColor = "#6b7280";
                        strokeWidth = 2;
                      }
                      
                      return (
                        <g key={country.code}>
                          {regions.map((region, regionIndex) => (
                            <path
                              key={`${country.code}-${regionIndex}`}
                              d={region.path}
                              fill={fillColor}
                              stroke={strokeColor}
                              strokeWidth={strokeWidth}
                              className={currentQuestion?.type === 'locate-country' && !isAnswered
                                ? "cursor-pointer hover:opacity-80 transition-all" 
                                : ""}
                              onClick={() => currentQuestion?.type === 'locate-country' && 
                                           !isAnswered && handleCountryClick(country.code)}
                              onMouseEnter={() => !isAnswered && setHoveredCountry(country.code)}
                            />
                          ))}
                          
                          {/* Country label */}
                          {(isHovered || isSelected || (showResult && isTargetCountry)) && (
                            <text
                              x={regions[0]?.centerX || 0}
                              y={regions[0]?.centerY || 0}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fontSize="12"
                              fontWeight="bold"
                              fill="#1f2937"
                              className="pointer-events-none select-none"
                              style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.8)' }}
                            >
                              {country.name.length > 12 ? country.name.substring(0, 12) + '...' : country.name}
                            </text>
                          )}
                        </g>
                      );
                    })}
                    
                    {/* Grid lines for better visual reference */}
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="0.5" opacity="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="800" height="500" fill="url(#grid)" />
                  </svg>
                  
                  {/* Map legend */}
                  <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-lg border">
                    <div className="flex flex-wrap gap-3 text-xs">
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-gray-300 rounded"></div>
                        <span>Countries</span>
                      </div>
                      {currentQuestion?.type === 'locate-country' && !isAnswered && (
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-gray-100 border border-gray-400 rounded"></div>
                          <span>Hover to see name</span>
                        </div>
                      )}
                      {showResult && (
                        <>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                            <span>Correct</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-red-500 rounded"></div>
                            <span>Incorrect</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Hint overlay for locate questions */}
                  {currentQuestion?.type === 'locate-country' && !isAnswered && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg p-3 shadow-lg border">
                      <p className="text-sm text-gray-600">
                        Click on <span className="font-semibold text-gray-900">{currentQuestion.country.name}</span> on the map
                      </p>
                    </div>
                  )}
                </div>
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
                    {currentQuestion.type === 'locate-country' ? (
                      <div className="text-center">
                        <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                        <h4 className="text-xl font-bold text-gray-900 mb-2">
                          Find: {currentQuestion.country.name}
                        </h4>
                        <div className="flex items-center justify-center space-x-2 mb-4">
                          <CountryFlag countryCode={currentQuestion.country.code} />
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
                      <div>
                        <div className="text-center mb-6">
                          <Globe className="w-12 h-12 text-green-600 mx-auto mb-4" />
                          <h4 className="text-xl font-bold text-gray-900 mb-2">
                            Name the Capital
                          </h4>
                          <div className="flex items-center justify-center space-x-2 mb-4">
                            <CountryFlag countryCode={currentQuestion.country.code} />
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
              <Card className={isCorrect ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
                <CardContent className="p-6 text-center">
                  {isCorrect ? (
                    <div className="text-green-600">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3" />
                      <h4 className="text-lg font-bold mb-2">Excellent!</h4>
                      <p>You got it right!</p>
                    </div>
                  ) : (
                    <div className="text-red-600">
                      <XCircle className="w-12 h-12 mx-auto mb-3" />
                      <h4 className="text-lg font-bold mb-2">Not quite!</h4>
                      {currentQuestion?.type === 'name-capital' && (
                        <div className="mt-3 p-3 bg-white rounded-lg">
                          <p className="text-sm text-gray-600">Correct answer:</p>
                          <p className="font-bold text-gray-900">{currentQuestion.correctAnswer}</p>
                          <PronunciationButton 
                            text={currentQuestion.correctAnswer} 
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

  // Helper function to generate country regions for the map
  function generateCountryRegions(country: Country, index: number, total: number) {
    const cols = Math.ceil(Math.sqrt(total));
    const x = (index % cols) * (800 / cols);
    const y = Math.floor(index / cols) * (500 / Math.ceil(total / cols));
    const width = 800 / cols;
    const height = 500 / Math.ceil(total / cols);
    
    // Create more interesting shapes for countries instead of rectangles
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const shapeVariant = index % 4;
    
    let path = "";
    
    switch (shapeVariant) {
      case 0: // Irregular polygon
        path = `M ${x + width * 0.2} ${y + height * 0.3} 
                L ${x + width * 0.8} ${y + height * 0.1} 
                L ${x + width * 0.9} ${y + height * 0.7} 
                L ${x + width * 0.6} ${y + height * 0.9} 
                L ${x + width * 0.1} ${y + height * 0.8} Z`;
        break;
      case 1: // Rounded rectangle
        path = `M ${x + width * 0.1} ${y + height * 0.2} 
                Q ${x + width * 0.1} ${y + height * 0.1} ${x + width * 0.2} ${y + height * 0.1}
                L ${x + width * 0.8} ${y + height * 0.1}
                Q ${x + width * 0.9} ${y + height * 0.1} ${x + width * 0.9} ${y + height * 0.2}
                L ${x + width * 0.9} ${y + height * 0.8}
                Q ${x + width * 0.9} ${y + height * 0.9} ${x + width * 0.8} ${y + height * 0.9}
                L ${x + width * 0.2} ${y + height * 0.9}
                Q ${x + width * 0.1} ${y + height * 0.9} ${x + width * 0.1} ${y + height * 0.8} Z`;
        break;
      case 2: // Star-like shape
        path = `M ${centerX} ${y + height * 0.1}
                L ${x + width * 0.7} ${y + height * 0.4}
                L ${x + width * 0.9} ${y + height * 0.4}
                L ${x + width * 0.75} ${y + height * 0.6}
                L ${x + width * 0.8} ${y + height * 0.9}
                L ${centerX} ${y + height * 0.75}
                L ${x + width * 0.2} ${y + height * 0.9}
                L ${x + width * 0.25} ${y + height * 0.6}
                L ${x + width * 0.1} ${y + height * 0.4}
                L ${x + width * 0.3} ${y + height * 0.4} Z`;
        break;
      default: // Oval
        path = `M ${x + width * 0.5} ${y + height * 0.1}
                Q ${x + width * 0.9} ${y + height * 0.1} ${x + width * 0.9} ${y + height * 0.5}
                Q ${x + width * 0.9} ${y + height * 0.9} ${x + width * 0.5} ${y + height * 0.9}
                Q ${x + width * 0.1} ${y + height * 0.9} ${x + width * 0.1} ${y + height * 0.5}
                Q ${x + width * 0.1} ${y + height * 0.1} ${x + width * 0.5} ${y + height * 0.1} Z`;
    }
    
    return [{
      path,
      centerX,
      centerY
    }];
  }
}
