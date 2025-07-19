import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lock, CheckCircle } from "lucide-react";
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

export function MasteryDetails() {
  const { data: masteryData, isLoading } = useQuery({
    queryKey: ["/api/user/mastery-details"],
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

  const masteredCountries = masteryData?.masteredCountries || [];
  const unmasteredCountries = masteryData?.unmasteredCountries || [];
  
  // Get all countries and merge with progress data
  const allCountriesWithProgress = countries.map(country => {
    const masteredProgress = masteredCountries.find(m => m.countryCode === country.code);
    const unmasteredProgress = unmasteredCountries.find(u => u.countryCode === country.code);
    const progress = masteredProgress || unmasteredProgress;
    
    return {
      ...country,
      masteryLevel: progress?.masteryLevel || 0,
      correctAnswers: progress?.correctAnswers || 0,
      totalAttempts: progress?.totalAttempts || 0,
      isMastered: (progress?.masteryLevel || 0) >= 80
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const masteredCount = allCountriesWithProgress.filter(c => c.isMastered).length;
  const totalCount = allCountriesWithProgress.length;
  const masteryPercentage = Math.round((masteredCount / totalCount) * 100);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Mastery Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{masteredCount}</div>
              <div className="text-sm text-gray-600">Countries Mastered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">{totalCount - masteredCount}</div>
              <div className="text-sm text-gray-600">Countries to Learn</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{masteryPercentage}%</div>
              <div className="text-sm text-gray-600">Overall Progress</div>
            </div>
          </div>
          <div className="mt-6">
            <Progress value={masteryPercentage} className="w-full h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Countries List */}
      <Card>
        <CardHeader>
          <CardTitle>All Countries Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {allCountriesWithProgress.map((country) => (
                <div
                  key={country.code}
                  className={`p-4 rounded-lg border ${
                    country.isMastered 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {/* Top row with country info and difficulty */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <CountryFlag 
                        countryCode={country.code} 
                        countryName={country.name} 
                        size="md"
                      />
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium ${country.isMastered ? 'text-gray-900' : 'text-gray-400'}`}>
                            {country.name}
                          </span>
                          <PronunciationButton 
                            text={country.name}
                            size="sm"
                            variant="ghost"
                            className="h-4 w-4 p-0"
                          />
                          {country.isMastered && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                          {!country.isMastered && country.totalAttempts === 0 && (
                            <Lock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${
                            country.isMastered 
                              ? 'text-gray-700' 
                              : 'text-gray-300 blur-sm select-none'
                          }`}>
                            Capital: {country.capital}
                          </span>
                          {country.isMastered && (
                            <PronunciationButton 
                              text={country.capital}
                              size="sm"
                              variant="ghost"
                              className="h-3 w-3 p-0"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge className={difficultyColors[country.difficulty as keyof typeof difficultyColors] || "bg-gray-100 text-gray-600"}>
                        {country.difficulty}
                      </Badge>
                      {country.totalAttempts > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {Math.round((country.correctAnswers / country.totalAttempts) * 100)}% accuracy
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress section spans full width */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          Mastery: {country.masteryLevel}%
                        </span>
                        {country.totalAttempts > 0 && (
                          <span className="text-xs text-gray-500">
                            ({country.correctAnswers}/{country.totalAttempts} correct)
                          </span>
                        )}
                      </div>
                      {country.masteryLevel >= 85 && country.totalAttempts >= 3 ? (
                        <span className="text-xs text-green-600 font-medium">Mastered</span>
                      ) : country.totalAttempts === 0 ? (
                        <span className="text-xs text-gray-400">Not Started</span>
                      ) : country.totalAttempts < 3 ? (
                        <span className="text-xs text-orange-500">Need {3 - country.totalAttempts} more</span>
                      ) : (
                        <span className="text-xs text-blue-600">Keep practicing</span>
                      )}
                    </div>
                    <div className="relative w-full">
                      <Progress 
                        value={country.masteryLevel} 
                        className="w-full h-3"
                      />
                      {/* Mastery threshold indicator line */}
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-0.5 h-2 bg-green-600 opacity-80"
                        style={{ left: '85%' }}
                      />
                    </div>
                    {country.totalAttempts > 0 && country.masteryLevel < 85 && (
                      <div className="mt-1 text-xs text-gray-400">
                        {85 - country.masteryLevel} points to mastery
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}