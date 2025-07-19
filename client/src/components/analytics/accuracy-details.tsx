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

  // Ensure all difficulty levels are represented
  const completeDifficultyData = allDifficultyLevels.map(level => {
    const existing = byDifficulty.find(item => item.difficulty === level);
    return existing || {
      difficulty: level,
      accuracy: 0,
      totalQuestions: 0,
      correctAnswers: 0
    };
  });

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
          <Card>
            <CardHeader>
              <CardTitle>
                {difficultyLabels[selectedDifficulty as keyof typeof difficultyLabels]} Level Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Detailed breakdown for {difficultyLabels[selectedDifficulty as keyof typeof difficultyLabels]} level coming soon!
                <br />
                This will show individual country performance, question types, and improvement suggestions.
              </div>
            </CardContent>
          </Card>
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
                  <Badge className={difficultyColors[item.difficulty as keyof typeof difficultyColors]}>
                    {difficultyLabels[item.difficulty as keyof typeof difficultyLabels]}
                  </Badge>
                  <div className="text-left">
                    <div className="text-sm text-gray-600">
                      {item.totalQuestions > 0 
                        ? `${item.totalQuestions} questions answered`
                        : "No questions answered yet"
                      }
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getAccuracyColor(item.accuracy)}`}>
                      {item.totalQuestions > 0 ? `${item.accuracy}%` : "—"}
                    </div>
                  </div>
                  <div className="w-32">
                    <Progress 
                      value={item.totalQuestions > 0 ? item.accuracy : 0} 
                      className="h-3"
                    />
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