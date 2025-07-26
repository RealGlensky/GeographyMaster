import React, { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DynamicDifficultySelector } from "@/components/dynamic-difficulty-selector";
import { Input } from "@/components/ui/input";
import { useDynamicQuiz } from "@/hooks/use-dynamic-quiz";
import { DynamicDifficultyLevel } from "@shared/schema";
import { countries } from "@/data/countries";
import { Clock, Target, Brain, CheckCircle, XCircle, RotateCcw, ArrowLeft, Keyboard, MousePointer } from "lucide-react";

export default function DynamicQuizPage() {
  const [, setLocation] = useLocation();
  const [selectedDifficulty, setSelectedDifficulty] = useState<DynamicDifficultyLevel>("adaptive");
  const [selectedQuizMode, setSelectedQuizMode] = useState<'multiple-choice' | 'typing'>('multiple-choice');
  const [hasStarted, setHasStarted] = useState(false);
  const [typingAnswer, setTypingAnswer] = useState("");

  const {
    currentQuestion,
    totalQuestions,
    score,
    currentQuestionData,
    timeRemaining,
    isComplete,
    selectedAnswer,
    showResult,
    currentCountry,
    startQuiz,
    submitAnswer,
    resetQuiz,
    isLoadingRecommendations,
    canStart,
    difficultyLevel,
    recommendedCountriesCount,
  } = useDynamicQuiz({
    mode: "quiz",
    difficultyLevel: selectedDifficulty,
    questionCount: 20,
    timePerQuestion: 30,
    quizMode: selectedQuizMode,
  });

  const handleStart = () => {
    setHasStarted(true);
    startQuiz();
  };

  // Clean console debug info - only log meaningful events
  React.useEffect(() => {
    if (!isLoadingRecommendations && canStart) {
      console.log(`Smart Quiz ready - ${recommendedCountriesCount} countries available for ${difficultyLevel} mode`);
    }
  }, [isLoadingRecommendations, canStart, recommendedCountriesCount, difficultyLevel]);

  const handleRestart = () => {
    setHasStarted(false);
    resetQuiz();
  };

  const handleBackToSelection = () => {
    setHasStarted(false);
    resetQuiz();
  };

  const handleExitQuiz = () => {
    setHasStarted(false);
    resetQuiz();
  };

  const handleTypingSubmit = () => {
    if (typingAnswer.trim()) {
      submitAnswer(typingAnswer.trim());
      setTypingAnswer("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showResult) {
      handleTypingSubmit();
    }
  };

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Smart Geography Quiz</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience personalized learning that adapts to your progress and maximizes your geography knowledge retention.
            </p>
          </div>

          <DynamicDifficultySelector 
            selectedLevel={selectedDifficulty}
            onSelect={setSelectedDifficulty}
          />

          <div className="mt-8 text-center">
            <div className="mb-6">
              {isLoadingRecommendations && (
                <p className="text-gray-600">Analyzing your progress and preparing personalized questions...</p>
              )}
              {!isLoadingRecommendations && canStart && (
                <div className="text-center">
                  <p className="text-green-600 font-medium mb-2">
                    Ready! {recommendedCountriesCount} countries selected for your {difficultyLevel} session.
                  </p>
                  <div className="text-sm text-gray-600">
                    {selectedDifficulty === 'adaptive' && "Countries matched to your skill level for optimal learning"}
                    {selectedDifficulty === 'review' && "Countries you've studied before that need reinforcement"}
                    {selectedDifficulty === 'challenge' && "Harder countries to push your knowledge further"}
                    {selectedDifficulty === 'mastery' && "Countries you're close to mastering - finish them off!"}
                  </div>
                </div>
              )}
              {!isLoadingRecommendations && !canStart && (
                <div className="text-center">
                  <p className="text-amber-600 font-medium mb-2">
                    Limited countries available for {difficultyLevel} mode right now.
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    {selectedDifficulty === 'review' && "As you practice more, countries will become available for review based on your progress."}
                    {selectedDifficulty === 'mastery' && "Complete more quizzes to have countries approaching mastery level."}
                    {selectedDifficulty === 'challenge' && "Try the adaptive mode first to build up your skills."}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedDifficulty('adaptive')}
                    className="text-sm"
                  >
                    Switch to Adaptive Mode
                  </Button>
                </div>
              )}
            </div>

            {/* Quiz Mode Selector */}
            <div className="space-y-4 mb-8">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Question Format</h3>
                <p className="text-gray-600">Choose how you'd like to answer questions</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <Card 
                  className={`cursor-pointer transition-all ${
                    selectedQuizMode === 'multiple-choice' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedQuizMode('multiple-choice')}
                >
                  <CardContent className="p-6 text-center">
                    <MousePointer className="mx-auto h-8 w-8 text-blue-600 mb-3" />
                    <h4 className="font-semibold text-gray-900 mb-2">Multiple Choice</h4>
                    <p className="text-sm text-gray-600">Click to select from 4 options</p>
                  </CardContent>
                </Card>
                
                <Card 
                  className={`cursor-pointer transition-all ${
                    selectedQuizMode === 'typing' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedQuizMode('typing')}
                >
                  <CardContent className="p-6 text-center">
                    <Keyboard className="mx-auto h-8 w-8 text-green-600 mb-3" />
                    <h4 className="font-semibold text-gray-900 mb-2">Type Answer</h4>
                    <p className="text-sm text-gray-600">Type the correct answer yourself</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Button 
              onClick={handleStart} 
              disabled={!canStart || isLoadingRecommendations}
              size="lg"
              className="px-8"
            >
              {isLoadingRecommendations ? (
                <>
                  <Brain className="mr-2 h-5 w-5 animate-spin" />
                  Preparing Your Quiz...
                </>
              ) : (
                <>
                  <Target className="mr-2 h-5 w-5" />
                  Start Smart Quiz
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isComplete) {
    const accuracy = Math.round((score / totalQuestions) * 100);
    
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <CardContent>
              <div className="mb-6">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
                <p className="text-xl text-gray-600">
                  You scored {score} out of {totalQuestions} ({accuracy}%)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <Target className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                  <div className="text-2xl font-bold text-blue-900">{accuracy}%</div>
                  <div className="text-sm text-blue-700">Accuracy</div>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <Brain className="mx-auto h-8 w-8 text-green-600 mb-2" />
                  <div className="text-2xl font-bold text-green-900">{difficultyLevel}</div>
                  <div className="text-sm text-green-700">Difficulty Level</div>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <CheckCircle className="mx-auto h-8 w-8 text-purple-600 mb-2" />
                  <div className="text-2xl font-bold text-purple-900">{score}</div>
                  <div className="text-sm text-purple-700">Correct Answers</div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-left">
                    <h4 className="font-semibold text-blue-900 mb-1">Smart Adaptation in Action</h4>
                    <p className="text-sm text-blue-700">
                      Your performance has been analyzed and your difficulty ratings have been updated. 
                      The next quiz will be even more personalized based on this session.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button onClick={handleRestart} size="lg">
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Try Again
                </Button>
                <Button onClick={handleBackToSelection} variant="outline" size="lg">
                  Change Difficulty
                </Button>
                <Button onClick={() => setLocation("/")} variant="outline" size="lg">
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!currentQuestionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="mx-auto h-12 w-12 text-blue-600 animate-spin mb-4" />
          <p className="text-lg text-gray-600">Loading your personalized question...</p>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion) / totalQuestions) * 100;
  const isCorrect = selectedAnswer === currentQuestionData.correctAnswer;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Exit Quiz
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Exit Quiz?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to exit the quiz? Your current progress will be lost and you'll need to start over.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Continue Quiz</AlertDialogCancel>
                    <AlertDialogAction onClick={handleExitQuiz}>Exit and Lose Progress</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Smart Geography Quiz</h1>
                <p className="text-gray-600">
                  Question {currentQuestion + 1} of {totalQuestions} • {difficultyLevel} mode
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{score}/{totalQuestions}</div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <Progress value={progress} className="flex-1" />
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span className="font-mono text-lg">{timeRemaining}s</span>
            </div>
          </div>
        </div>

        {/* Country info */}
        {currentCountry && (
          <div className="bg-white rounded-lg p-4 mb-6 border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src={`https://flagcdn.com/w40/${currentCountry.code.toLowerCase()}.png`}
                  alt={`${currentCountry.name} flag`}
                  className={`w-8 h-6 object-cover rounded shadow-sm ${
                    currentQuestionData.type === 'country-to-capital' 
                      ? 'filter grayscale blur-sm opacity-50' 
                      : ''
                  }`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div>
                  <h3 className={`font-semibold ${
                    currentQuestionData.type === 'country-to-capital' 
                      ? 'text-gray-400 filter blur-sm' 
                      : 'text-gray-900'
                  }`}>
                    {currentCountry.name}
                  </h3>
                  <p className="text-sm text-gray-600">{currentCountry.continent}</p>
                </div>
              </div>
              <div className="text-right">
                {currentCountry.masteryLevel !== undefined && (
                  <div className="text-sm text-gray-600">
                    Mastery: {currentCountry.masteryLevel}%
                  </div>
                )}
                {currentCountry.recommendationReason && (
                  <div className="text-xs text-blue-600">
                    {currentCountry.recommendationReason}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Question */}
        <Card className="mb-6">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className={`text-2xl font-bold mb-4 flex items-center justify-center gap-3 ${
                currentQuestionData.type === 'country-to-capital' 
                  ? 'text-gray-400 filter blur-sm' 
                  : 'text-gray-900'
              }`}>
                {currentQuestionData.type === 'country-to-capital' ? (
                  <>
                    <img 
                      src={`https://flagcdn.com/w40/${currentCountry?.code.toLowerCase()}.png`}
                      alt={`${currentQuestionData.country} flag`}
                      className="w-8 h-6 object-cover rounded shadow-sm filter grayscale blur-sm opacity-50"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    What is the capital of {currentQuestionData.country}?
                  </>
                ) : (
                  <>
                    Which country has {currentQuestionData.capital} as its capital?
                    <img 
                      src={`https://flagcdn.com/w40/${currentCountry?.code.toLowerCase()}.png`}
                      alt={`${currentQuestionData.country} flag`}
                      className="w-8 h-6 object-cover rounded shadow-sm"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </>
                )}
              </h2>
            </div>

            {selectedQuizMode === 'multiple-choice' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestionData.options.map((option) => {
                  let buttonClass = "p-4 text-left border-2 border-gray-200 hover:border-blue-300 bg-white";
                  
                  if (showResult && selectedAnswer) {
                    if (option === currentQuestionData.correctAnswer) {
                      buttonClass = "p-4 text-left border-2 border-green-500 bg-green-50 text-green-800";
                    } else if (option === selectedAnswer) {
                      buttonClass = "p-4 text-left border-2 border-red-500 bg-red-50 text-red-800";
                    } else {
                      buttonClass = "p-4 text-left border-2 border-gray-200 bg-gray-50 text-gray-600";
                    }
                  }

                  // Check if this is a country name option to show flag
                  const isCountryOption = currentQuestionData.type === 'capital-to-country';
                  const countryForFlag = isCountryOption ? 
                    countries.find(country => country.name === option) : null;

                  return (
                    <button
                      key={option}
                      onClick={() => !showResult && submitAnswer(option)}
                      disabled={showResult}
                      className={`${buttonClass} rounded-lg transition-all text-lg font-medium`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {countryForFlag && (
                            <img 
                              src={`https://flagcdn.com/w40/${countryForFlag.code.toLowerCase()}.png`}
                              alt={`${option} flag`}
                              className="w-6 h-4 object-cover rounded shadow-sm"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          )}
                          <span>{option}</span>
                        </div>
                        <div className="flex items-center">
                          {showResult && option === currentQuestionData.correctAnswer && (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          )}
                          {showResult && option === selectedAnswer && option !== currentQuestionData.correctAnswer && (
                            <XCircle className="h-6 w-6 text-red-600" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <div className="space-y-4">
                  <Input
                    type="text"
                    value={typingAnswer}
                    onChange={(e) => setTypingAnswer(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your answer here..."
                    disabled={showResult}
                    className="text-lg p-4 text-center"
                    autoFocus
                  />
                  {!showResult && (
                    <Button
                      onClick={handleTypingSubmit}
                      disabled={!typingAnswer.trim()}
                      className="w-full"
                      size="lg"
                    >
                      Submit Answer
                    </Button>
                  )}
                  {showResult && (
                    <div className="p-4 border-2 rounded-lg bg-gray-50">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Correct Answer:</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {currentQuestionData.correctAnswer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {showResult && (
              <div className="mt-6 text-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-semibold ${
                  isCorrect 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {isCorrect ? (
                    <>
                      <CheckCircle className="h-6 w-6" />
                      Correct!
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6" />
                      Incorrect
                    </>
                  )}
                </div>
                <p className="mt-2 text-gray-600">
                  {currentQuestion + 1 === totalQuestions 
                    ? "Calculating your results..." 
                    : "Next question in a moment..."
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}