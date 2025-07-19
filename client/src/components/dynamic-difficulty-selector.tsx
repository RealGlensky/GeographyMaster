import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { DynamicDifficultyLevel, CountryWithDynamicDifficulty } from "@shared/schema";
import { Brain, BookOpen, Zap, Trophy } from "lucide-react";

interface DynamicDifficultySelectorProps {
  selectedLevel: DynamicDifficultyLevel;
  onSelect: (level: DynamicDifficultyLevel) => void;
}

const difficultyLevelData = {
  review: {
    label: "Review",
    description: "Countries due for review based on your progress",
    icon: BookOpen,
    badgeColor: "bg-orange-100 text-orange-600",
    borderColor: "hover:border-orange-500",
  },
  adaptive: {
    label: "Adaptive",
    description: "Personalized difficulty based on your performance",
    icon: Brain,
    badgeColor: "bg-blue-100 text-blue-600",
    borderColor: "hover:border-blue-500",
  },
  challenge: {
    label: "Challenge",
    description: "Harder countries to push your limits",
    icon: Zap,
    badgeColor: "bg-purple-100 text-purple-600",
    borderColor: "hover:border-purple-500",
  },
  mastery: {
    label: "Mastery",
    description: "Countries close to mastery - finish them off",
    icon: Trophy,
    badgeColor: "bg-green-100 text-green-600",
    borderColor: "hover:border-green-500",
  },
};

export function DynamicDifficultySelector({ selectedLevel, onSelect }: DynamicDifficultySelectorProps) {
  const [previewLevel, setPreviewLevel] = useState<DynamicDifficultyLevel | null>(null);

  // Fetch recommended countries for preview
  const { data: recommendedCountries } = useQuery({
    queryKey: ['/api/user/recommended-countries', previewLevel],
    enabled: previewLevel !== null,
  });

  const handleLevelHover = (level: DynamicDifficultyLevel) => {
    setPreviewLevel(level);
  };

  const handleLevelLeave = () => {
    setPreviewLevel(null);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Smart Difficulty Selection</h3>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Our AI analyzes your performance and learning patterns to recommend the perfect countries for your next study session.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.entries(difficultyLevelData) as [DynamicDifficultyLevel, typeof difficultyLevelData.review][]).map(([key, data]) => {
          const Icon = data.icon;
          return (
            <Card
              key={key}
              className={`cursor-pointer transition-all ${data.borderColor} ${
                selectedLevel === key ? 'border-primary ring-2 ring-primary/20 scale-105' : ''
              }`}
              onClick={() => onSelect(key)}
              onMouseEnter={() => handleLevelHover(key)}
              onMouseLeave={handleLevelLeave}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-gray-700" />
                    <h4 className="font-semibold text-gray-900">{data.label}</h4>
                  </div>
                  <Badge className={data.badgeColor}>
                    Smart
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-4">{data.description}</p>
                
                {selectedLevel === key && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-green-600 font-medium">✓ Currently Selected</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Preview Section */}
      {previewLevel && recommendedCountries && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">
            Preview: {difficultyLevelData[previewLevel].label} Mode
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {(recommendedCountries as CountryWithDynamicDifficulty[]).slice(0, 10).map((country) => (
              <div 
                key={country.code}
                className="flex items-center gap-2 p-2 bg-white rounded border text-sm"
              >
                <div className="flex-1">
                  <div className="font-medium">{country.name}</div>
                  {country.recommendationReason && (
                    <div className="text-xs text-gray-500">{country.recommendationReason}</div>
                  )}
                </div>
                {country.masteryLevel !== undefined && (
                  <div className="text-xs font-mono text-gray-600">
                    {country.masteryLevel}%
                  </div>
                )}
              </div>
            ))}
          </div>
          {(recommendedCountries as CountryWithDynamicDifficulty[]).length > 10 && (
            <p className="text-sm text-gray-500 mt-2">
              And {(recommendedCountries as CountryWithDynamicDifficulty[]).length - 10} more countries...
            </p>
          )}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">How Dynamic Difficulty Works</h4>
            <p className="text-sm text-blue-700">
              The system tracks your accuracy, response time, and consistency for each country, then adjusts 
              recommendations in real-time. This ensures you're always challenged at the right level to maximize learning.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}