import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Target, TrendingDown, BookOpen, Brain, ArrowLeft, ChevronRight } from "lucide-react";
import { CountryFlag } from "@/components/country-flag";
import { PronunciationButton } from "@/components/pronunciation-button";
import { countries } from "@/data/countries";

// Difficulty color mapping to match the difficulty selector
const difficultyColors = {
  beginner: "bg-green-100 text-green-600",
  easy: "bg-blue-100 text-blue-600", 
  intermediate: "bg-yellow-100 text-yellow-600",
  advanced: "bg-orange-100 text-orange-600",
  expert: "bg-red-100 text-red-600",
};

const difficultyLabels = {
  beginner: "Beginner",
  easy: "Easy",
  intermediate: "Intermediate", 
  advanced: "Advanced",
  expert: "Expert",
};

// All difficulty levels to ensure complete coverage
const allDifficultyLevels = ['beginner', 'easy', 'intermediate', 'advanced', 'expert'];

export function AccuracyDetails() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  
  const { data: accuracyData, isLoading } = useQuery({
    queryKey: ["/api/user/accuracy-details"],
  });

  const { data: difficultyDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ["/api/user/accuracy-details", selectedDifficulty],
    queryFn: async () => {
      if (!selectedDifficulty) return null;
      const response = await fetch(`/api/user/accuracy-details?difficulty=${selectedDifficulty}`);
      if (!response.ok) throw new Error('Failed to fetch difficulty details');
      return response.json();
    },
    enabled: !!selectedDifficulty
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
              <div className="h-32 bg-gray-300 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { byDifficulty = [], byStudyMode = [], worstCountries = [] } = accuracyData || {};

  // Ensure all difficulty levels are represented with calculated metrics
  const completeDifficultyData = allDifficultyLevels.map(level => {
    const existing = byDifficulty.find(item => item.difficulty === level);
    const data = existing || {
      difficulty: level,
      accuracy: 0,
      totalQuestions: 0
    };
    
    return {
      ...data,
      correctAnswers: Math.round((data.accuracy / 100) * data.totalQuestions),
      incorrectAnswers: data.totalQuestions - Math.round((data.accuracy / 100) * data.totalQuestions),
      completionRate: data.totalQuestions > 0 ? 100 : 0,
      performanceLevel: data.accuracy >= 90 ? 'excellent' : data.accuracy >= 75 ? 'good' : data.accuracy >= 60 ? 'fair' : data.accuracy >= 40 ? 'needs-work' : 'struggling'
    };
  });

  const getPerformanceColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'fair': return 'text-yellow-600 bg-yellow-50';
      case 'needs-work': return 'text-orange-600 bg-orange-50';
      case 'struggling': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPerformanceLabel = (level: string) => {
    switch (level) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'fair': return 'Fair';
      case 'needs-work': return 'Needs Work';
      case 'struggling': return 'Struggling';
      default: return 'No Data';
    }
  };

  const getRecommendation = (difficulty: any) => {
    if (difficulty.totalQuestions === 0) {
      return "Start practicing to build experience in this difficulty level.";
    }
    if (difficulty.accuracy >= 90) {
      return "Excellent performance! You've mastered this level.";
    }
    if (difficulty.accuracy >= 75) {
      return "Good work! Focus on consistency to reach excellence.";
    }
    if (difficulty.accuracy >= 60) {
      return "Keep practicing. Review incorrect answers to improve.";
    }
    if (difficulty.accuracy >= 40) {
      return "More practice needed. Consider reviewing fundamentals.";
    }
    return "Focus on this level with targeted practice sessions.";
  };

  // Show detailed view if a difficulty is selected
  if (selectedDifficulty) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setSelectedDifficulty(null)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Overview
          </Button>
          <div className="flex items-center gap-2">
            <Badge className={difficultyColors[selectedDifficulty as keyof typeof difficultyColors]}>
              {difficultyLabels[selectedDifficulty as keyof typeof difficultyLabels]}
            </Badge>
            <span className="text-lg font-semibold">Detailed Performance</span>
          </div>
        </div>

        {isLoadingDetails ? (
          <Card>
            <CardContent className="p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                <div className="h-32 bg-gray-300 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  {difficultyLabels[selectedDifficulty as keyof typeof difficultyLabels]} Level Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const selectedData = completeDifficultyData.find(d => d.difficulty === selectedDifficulty);
                  if (!selectedData || selectedData.totalQuestions === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <div className="text-lg font-medium mb-2">No practice data yet</div>
                        <div className="text-sm">
                          Start practicing at the {difficultyLabels[selectedDifficulty as keyof typeof difficultyLabels]} level to see detailed performance analytics.
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          {selectedData.accuracy}%
                        </div>
                        <div className="text-sm text-gray-600">Overall Accuracy</div>
                        <Badge className={`mt-2 ${getPerformanceColor(selectedData.performanceLevel)}`}>
                          {getPerformanceLabel(selectedData.performanceLevel)}
                        </Badge>
                      </div>

                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-3xl font-bold text-green-600 mb-2">
                          {selectedData.correctAnswers}
                        </div>
                        <div className="text-sm text-gray-600">Correct Answers</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Out of {selectedData.totalQuestions} total
                        </div>
                      </div>

                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-3xl font-bold text-red-600 mb-2">
                          {selectedData.incorrectAnswers}
                        </div>
                        <div className="text-sm text-gray-600">Incorrect Answers</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {selectedData.totalQuestions > 0 ? Math.round((selectedData.incorrectAnswers / selectedData.totalQuestions) * 100) : 0}% of total
                        </div>
                      </div>

                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-3xl font-bold text-purple-600 mb-2">
                          {selectedData.totalQuestions}
                        </div>
                        <div className="text-sm text-gray-600">Questions Attempted</div>
                        <div className="text-xs text-gray-500 mt-1">
                          At this difficulty level
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Performance Analysis */}
            {(() => {
              const selectedData = completeDifficultyData.find(d => d.difficulty === selectedDifficulty);
              if (!selectedData || selectedData.totalQuestions === 0) return null;

              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-orange-600" />
                        Performance Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Accuracy Rate</span>
                          <span className={`font-bold ${getAccuracyColor(selectedData.accuracy)}`}>
                            {selectedData.accuracy}%
                          </span>
                        </div>
                        <Progress value={selectedData.accuracy} className="h-2" />
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Success Ratio</span>
                          <span className="font-bold text-gray-700">
                            {selectedData.correctAnswers}:{selectedData.incorrectAnswers}
                          </span>
                        </div>
                        <div className="flex h-2 rounded-full overflow-hidden bg-gray-200">
                          <div 
                            className="bg-green-500" 
                            style={{ width: `${(selectedData.correctAnswers / selectedData.totalQuestions) * 100}%` }}
                          />
                          <div 
                            className="bg-red-500" 
                            style={{ width: `${(selectedData.incorrectAnswers / selectedData.totalQuestions) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="text-sm font-medium mb-2">Performance Level</div>
                        <Badge className={`${getPerformanceColor(selectedData.performanceLevel)} px-3 py-1`}>
                          {getPerformanceLabel(selectedData.performanceLevel)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-green-600" />
                        Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <div className="font-medium text-blue-800 mb-2">Suggestion</div>
                          <div className="text-sm text-blue-700">
                            {getRecommendation(selectedData)}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="text-sm font-medium">Next Steps:</div>
                          <ul className="text-sm text-gray-600 space-y-2">
                            {selectedData.accuracy < 60 && (
                              <li className="flex items-start gap-2">
                                <span className="text-orange-500 mt-1">•</span>
                                Focus on reviewing fundamentals for this difficulty level
                              </li>
                            )}
                            {selectedData.accuracy >= 60 && selectedData.accuracy < 80 && (
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                Practice consistently to improve accuracy
                              </li>
                            )}
                            {selectedData.accuracy >= 80 && selectedData.accuracy < 90 && (
                              <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-1">•</span>
                                Focus on eliminating small mistakes for excellence
                              </li>
                            )}
                            {selectedData.accuracy >= 90 && (
                              <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-1">•</span>
                                Consider advancing to the next difficulty level
                              </li>
                            )}
                            <li className="flex items-start gap-2">
                              <span className="text-purple-500 mt-1">•</span>
                              Review incorrect answers to understand patterns
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-gray-500 mt-1">•</span>
                              Practice with different study modes for variety
                            </li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}

            {/* Countries Performance for this difficulty level */}
            {difficultyDetails && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    Countries Needing Attention
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {difficultyDetails.worstCountries?.length > 0 ? (
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {difficultyDetails.worstCountries.slice(0, 10).map((country: any, index: number) => {
                          const countryData = countries.find(c => c.code === country.countryCode);
                          return (
                            <div key={country.countryCode} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-6 flex items-center justify-center bg-gray-100 rounded text-xs font-medium">
                                  #{index + 1}
                                </div>
                                <CountryFlag countryCode={country.countryCode} />
                                <div>
                                  <div className="font-medium">{countryData?.name || country.countryCode}</div>
                                  <div className="text-sm text-gray-600">
                                    Capital: {countryData?.capital || 'Unknown'}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex items-center gap-2">
                                <Badge variant={getAccuracyBadgeVariant(country.accuracy)}>
                                  {country.accuracy}%
                                </Badge>
                                <div className="text-xs text-gray-500">
                                  {country.totalAttempts} attempts
                                </div>
                                <PronunciationButton 
                                  countryName={countryData?.name || country.countryCode}
                                  capitalName={countryData?.capital || ''}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <div className="text-lg font-medium mb-2">Great job!</div>
                      <div className="text-sm">
                        No countries need special attention at this difficulty level.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    );
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-600';
    if (accuracy >= 80) return 'text-blue-600';
    if (accuracy >= 70) return 'text-yellow-600';
    if (accuracy >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getAccuracyBadgeVariant = (accuracy: number) => {
    if (accuracy >= 90) return 'default';
    if (accuracy >= 80) return 'secondary';
    if (accuracy >= 70) return 'outline';
    return 'destructive';
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'quiz': return '🧠';
      case 'flashcards': return '📚';
      case 'typing': return '⌨️';
      case 'map': return '🗺️';
      default: return '📝';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '🌱';
      case 'easy': return '🟢';
      case 'intermediate': return '🟡';
      case 'advanced': return '🟠';
      case 'expert': return '🔴';
      default: return '⭐';
    }
  };

  return (
    <div className="space-y-6">
      {/* Accuracy by Difficulty */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Accuracy by Difficulty Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {completeDifficultyData.map((item) => (
              <button
                key={item.difficulty}
                onClick={() => setSelectedDifficulty(item.difficulty)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer border-2 border-transparent hover:border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{getDifficultyIcon(item.difficulty)}</div>
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={difficultyColors[item.difficulty as keyof typeof difficultyColors]}>
                        {difficultyLabels[item.difficulty as keyof typeof difficultyLabels]}
                      </Badge>
                      {item.totalQuestions > 0 && (
                        <Badge className={`${getPerformanceColor(item.performanceLevel)} text-xs`}>
                          {getPerformanceLabel(item.performanceLevel)}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {item.totalQuestions > 0 
                        ? `${item.correctAnswers}/${item.totalQuestions} correct (${item.incorrectAnswers} wrong)`
                        : "No questions answered yet"
                      }
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right min-w-[80px]">
                    <div className={`text-2xl font-bold ${getAccuracyColor(item.accuracy)}`}>
                      {item.totalQuestions > 0 ? `${item.accuracy}%` : "—"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.totalQuestions > 0 ? "accuracy" : "start practicing"}
                    </div>
                  </div>
                  <div className="w-32">
                    <Progress 
                      value={item.totalQuestions > 0 ? item.accuracy : 0} 
                      className="h-3"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Accuracy by Study Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-green-600" />
            Accuracy by Study Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {byStudyMode.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No study mode data available yet. Try different learning modes to see your performance comparison!
              </div>
            ) : (
              byStudyMode.map((item) => (
                <div key={item.mode} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getModeIcon(item.mode)}</span>
                    <div>
                      <div className="font-medium capitalize">{item.mode}</div>
                      <div className="text-sm text-gray-600">
                        {item.totalQuestions} questions answered
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getAccuracyColor(item.accuracy)}`}>
                        {item.accuracy}%
                      </div>
                    </div>
                    <div className="w-32">
                      <Progress 
                        value={item.accuracy} 
                        className="h-3"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Countries Needing Improvement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            Countries Needing Improvement
          </CardTitle>
        </CardHeader>
        <CardContent>
          {worstCountries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No performance data available yet. Complete some quizzes to see which countries need more practice!
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {worstCountries.map((item, index) => {
                  const country = countries.find(c => c.code === item.countryCode);
                  if (!country) return null;

                  return (
                    <div key={item.countryCode} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 bg-red-100 rounded-full text-xs font-bold text-red-600">
                          {index + 1}
                        </div>
                        <CountryFlag 
                          countryCode={country.code} 
                          countryName={country.name} 
                          size="sm"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{country.name}</span>
                            <PronunciationButton 
                              text={country.name}
                              size="sm"
                              variant="ghost"
                              className="h-3 w-3 p-0"
                            />
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{country.capital}</span>
                            <PronunciationButton 
                              text={country.capital}
                              size="sm"
                              variant="ghost"
                              className="h-3 w-3 p-0"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={getAccuracyBadgeVariant(item.accuracy)}>
                          {item.accuracy}% accuracy
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          {item.totalAttempts} attempts
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Study Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Improvement Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="font-medium text-blue-800 mb-2">Focus on Weak Areas</div>
              <div className="text-sm text-blue-700">
                Practice the countries listed above more frequently using different study modes.
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="font-medium text-green-800 mb-2">Use Audio Pronunciation</div>
              <div className="text-sm text-green-700">
                Click the speaker icons to hear correct pronunciation and improve memorization.
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="font-medium text-purple-800 mb-2">Mix Study Modes</div>
              <div className="text-sm text-purple-700">
                Try different learning modes to reinforce knowledge through varied approaches.
              </div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="font-medium text-orange-800 mb-2">Regular Practice</div>
              <div className="text-sm text-orange-700">
                Consistent daily practice, even for short periods, improves retention significantly.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}