import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, CheckCircle, XCircle, Clock } from "lucide-react";
import { Difficulty, Country, User } from "@shared/schema";
import { getCountriesByDifficulty } from "@/data/countries";
import { isTypingCorrect, formatTime } from "@/lib/utils";
import { CountryFlag } from "@/components/country-flag";
import { PronunciationButton } from "@/components/pronunciation-button";

interface TypingQuestion {
  country: Country;
  type: "country" | "capital";
  prompt: string;
  answer: string;
}

export default function TypingPractice() {
  const [, setLocation] = useLocation();
  const [urlParams] = useState(() => new URLSearchParams(window.location.search));
  const difficulty = (urlParams.get("difficulty") || "beginner") as Difficulty;
  
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });
  
  const [countries] = useState(() => getCountriesByDifficulty(difficulty));
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions] = useState<TypingQuestion[]>(() => {
    return countries.slice(0, 10).map(country => {
      const isCountryQuestion = Math.random() > 0.5;
      return {
        country,
        type: isCountryQuestion ? "country" : "capital",
        prompt: isCountryQuestion 
          ? `Type the country name for capital: ${country.capital}`
          : `Type the capital of: ${country.name}`,
        answer: isCountryQuestion ? country.name : country.capital,
      };
    });
  });
  
  const [userInput, setUserInput] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(45);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [startTime] = useState(Date.now());
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  const currentQuestionData = questions[currentQuestion];

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentQuestion]);

  useEffect(() => {
    if (timeRemaining > 0 && !isSubmitted && !sessionComplete) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && !isSubmitted) {
      handleSubmit();
    }
  }, [timeRemaining, isSubmitted, sessionComplete]);

  const handleClose = () => {
    setLocation("/");
  };

  const handleSubmit = () => {
    if (isSubmitted) return;
    
    const correct = isTypingCorrect(userInput, currentQuestionData.answer);
    setIsCorrect(correct);
    setIsSubmitted(true);
    
    if (correct) {
      setScore(prev => prev + 1);
    }
    
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setUserInput("");
        setIsSubmitted(false);
        setTimeRemaining(45);
      } else {
        setSessionComplete(true);
      }
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitted) {
      handleSubmit();
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setUserInput("");
    setIsSubmitted(false);
    setIsCorrect(false);
    setScore(0);
    setTimeRemaining(45);
    setSessionComplete(false);
  };

  if (sessionComplete) {
    const accuracy = Math.round((score / questions.length) * 100);
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              {accuracy >= 80 ? (
                <CheckCircle className="w-16 h-16 text-secondary mx-auto mb-4" />
              ) : (
                <XCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              )}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Complete!</h2>
              <p className="text-gray-600">You scored {score} out of {questions.length}</p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Accuracy</span>
                <span className="font-semibold">{accuracy}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Time</span>
                <span className="font-semibold">{formatTime(totalTime)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Difficulty</span>
                <Badge variant="secondary" className="capitalize">{difficulty}</Badge>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button onClick={handleRestart} className="flex-1">
                Try Again
              </Button>
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Typing Practice</h1>
              <p className="text-gray-600 capitalize">{difficulty} Level</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline">
              {currentQuestion + 1} / {questions.length}
            </Badge>
            <Badge variant="secondary">
              Score: {score}
            </Badge>
          </div>
        </div>

        <Card>
          <CardContent className="p-8">
            {/* Question */}
            <div className="text-center mb-8">
              <div className="mb-4">
                {!user?.hideFlagsInQuiz && (
                  <CountryFlag 
                    countryCode={currentQuestionData.country.code} 
                    countryName={currentQuestionData.country.name} 
                    size="lg"
                    className="mx-auto mb-2"
                  />
                )}
              </div>
              <div className="flex items-center justify-center gap-2 mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentQuestionData.prompt}
                </h2>
                <PronunciationButton 
                  text={currentQuestionData.type === "capital" 
                    ? currentQuestionData.country.name || ''
                    : currentQuestionData.answer || ''
                  }
                  size="sm"
                />
              </div>
              <Badge variant="outline" className="mb-4">
                {currentQuestionData.country.continent}
              </Badge>
            </div>

            {/* Input Area */}
            <div className="space-y-4 mb-6">
              <div className="relative">
                <Input
                  ref={inputRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your answer here..."
                  className={`text-lg p-4 typing-input ${
                    isSubmitted 
                      ? isCorrect 
                        ? "typing-correct border-green-500" 
                        : "typing-incorrect border-red-500"
                      : ""
                  }`}
                  disabled={isSubmitted}
                />
                {isSubmitted && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              
              {isSubmitted && !isCorrect && (
                <div className="text-center">
                  <p className="text-red-600 font-medium">
                    Correct answer: {currentQuestionData.answer}
                  </p>
                </div>
              )}
            </div>

            {/* Timer and Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="w-5 h-5" />
                <span className={timeRemaining <= 10 ? "text-red-500 font-bold" : ""}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitted || !userInput.trim()}
                className="px-8"
              >
                {isSubmitted ? "Next..." : "Submit"}
              </Button>
            </div>

            {/* Hint */}
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500">
                Press Enter to submit • {currentQuestionData.answer.length} letters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(((currentQuestion + (isSubmitted ? 1 : 0)) / questions.length) * 100)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + (isSubmitted ? 1 : 0)) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
