import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Difficulty } from "@shared/schema";

interface DifficultySelectorProps {
  selectedDifficulty: Difficulty | null;
  onSelect: (difficulty: Difficulty) => void;
}

const difficultyData = {
  beginner: {
    label: "Beginner",
    description: "Major countries and well-known capitals",
    count: "~50 countries",
    badgeColor: "bg-green-100 text-green-600",
    borderColor: "hover:border-green-500",
  },
  intermediate: {
    label: "Intermediate", 
    description: "All countries by continent",
    count: "~120 countries",
    badgeColor: "bg-yellow-100 text-yellow-600",
    borderColor: "hover:border-yellow-500",
  },
  expert: {
    label: "Expert",
    description: "All 195 countries worldwide", 
    count: "195 countries",
    badgeColor: "bg-red-100 text-red-600",
    borderColor: "hover:border-red-500",
  },
};

export function DifficultySelector({ selectedDifficulty, onSelect }: DifficultySelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900">Select Difficulty Level</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.entries(difficultyData) as [Difficulty, typeof difficultyData.beginner][]).map(([key, data]) => (
          <Card
            key={key}
            className={`cursor-pointer transition-all ${data.borderColor} ${
              selectedDifficulty === key ? 'border-primary ring-2 ring-primary/20' : ''
            }`}
            onClick={() => onSelect(key)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{data.label}</h4>
                <Badge className={data.badgeColor}>
                  {key === 'beginner' ? 'Easy' : key === 'intermediate' ? 'Medium' : 'Hard'}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">{data.description}</p>
              <p className="text-xs text-gray-500">{data.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
