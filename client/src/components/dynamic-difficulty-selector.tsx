import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DynamicDifficultyLevel } from "@shared/schema";
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
              className={`cursor-pointer transition-all duration-200 ${data.borderColor} ${
                selectedLevel === key ? 'border-primary ring-2 ring-primary/20 scale-105' : 'hover:scale-102'
              }`}
              onClick={() => onSelect(key)}
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