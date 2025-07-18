import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { X, Clock, CheckCircle, XCircle } from "lucide-react";
import { useQuiz } from "@/hooks/use-quiz";
import { Difficulty } from "@shared/schema";
import { formatTime } from "@/lib/utils";

export default function Quiz() {
  const [, setLocation] = useLocation();
  const [urlParams] = useState(() => new URLSearchParams(window.location.search));
  const difficulty = (urlParams.get("difficulty") || "beginner") as Difficulty;
  
  const {
    currentQuestion,
    totalQuestions,
    score,
    currentQuestionData,
    timeRemaining,
    isComplete,
    selectedAnswer,
    showResult,
    startQuiz,
    submitAnswer,
    resetQuiz,
    isLoading,
    isSubmitting,
  } = useQuiz({
    mode: "quiz",
    difficulty,
    questionCount: 10,
    timePerQuestion: 30,
  });

  useEffect(() => {
    startQuiz();
  }, []);

  const handleClose = () => {
    setLocation("/");
  };

  const handleAnswerSelect = (answer: string) => {
    if (showResult || isSubmitting) return;
    submitAnswer(answer);
  };

  const handleRestart = () => {
    resetQuiz();
    startQuiz();
  };

  const progressPercentage = (currentQuestion / totalQuestions) * 100;
  const isCorrectAnswer = (option: string) => option === currentQuestionData?.correctAnswer;
  const isSelectedAnswer = (option: string) => option === selectedAnswer;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing your quiz...</p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    const accuracy = Math.round((score / totalQuestions) * 100);
    
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
              <p className="text-gray-600">You scored {score} out of {totalQuestions}</p>
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
        <Card>
          <CardContent className="p-0">
            {/* Quiz Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  <X className="w-4 h-4" />
                </Button>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Quick Quiz</h2>
                  <p className="text-sm text-gray-600 capitalize">
                    {difficulty} Level
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Question</p>
                  <p className="font-bold text-gray-900">
                    {currentQuestion}/{totalQuestions}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Score</p>
                  <p className="font-bold text-primary">{score}/{currentQuestion - 1}</p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="px-6 pt-4">
              <Progress value={progressPercentage} className="h-2" />
            </div>

            {/* Quiz Content */}
            <div className="p-6 space-y-6">
              {/* Question */}
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {currentQuestionData?.type === "country-to-capital"
                    ? `What is the capital of ${currentQuestionData.country}?`
                    : `Which country has ${currentQuestionData?.capital} as its capital?`
                  }
                </h3>
                <p className="text-gray-600">Select the correct answer</p>
              </div>

              {/* Answer Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestionData?.options.map((option) => {
                  let isCorrect = isCorrectAnswer(option);
                  let isSelected = isSelectedAnswer(option);
                  
                  let buttonStyle: React.CSSProperties = {};
                  let buttonClass = "p-4 border-2 border-gray-200 rounded-lg text-left transition-all quiz-option";
                  
                  if (showResult) {
                    if (isCorrect) {
                      buttonStyle = {
                        borderColor: '#22c55e',
                        borderWidth: '3px',
                        backgroundColor: '#22c55e10',
                        boxShadow: '0 0 0 2px #22c55e30'
                      };
                      buttonClass = "p-4 rounded-lg text-left transition-all quiz-option";
                    } else if (isSelected && !isCorrect) {
                      buttonStyle = {
                        borderColor: '#ef4444',
                        borderWidth: '3px',
                        backgroundColor: '#ef444410',
                        boxShadow: '0 0 0 2px #ef444430'
                      };
                      buttonClass = "p-4 rounded-lg text-left transition-all quiz-option";
                    }
                  } else {
                    buttonClass += " hover:border-primary hover:bg-primary/5";
                  }

                  return (
                    <button
                      key={option}
                      className={buttonClass}
                      style={buttonStyle}
                      onClick={() => handleAnswerSelect(option)}
                      disabled={showResult || isSubmitting}
                    >
                      <span className={`font-medium ${showResult && isCorrect ? 'text-green-700' : showResult && isSelected && !isCorrect ? 'text-red-700' : 'text-gray-900'}`}>
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Timer */}
              <div className="flex items-center justify-center space-x-2 text-gray-600">
                <Clock className="w-5 h-5" />
                <span className={timeRemaining <= 10 ? "text-red-500 font-bold" : ""}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
