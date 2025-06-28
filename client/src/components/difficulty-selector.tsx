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
    description: "Most famous countries and capitals",
    count: "27 countries",
    badgeColor: "bg-green-100 text-green-600",
    borderColor: "hover:border-green-500",
  },
  easy: {
    label: "Easy", 
    description: "Well-known countries worldwide",
    count: "36 countries",
    badgeColor: "bg-blue-100 text-blue-600",
    borderColor: "hover:border-blue-500",
  },
  intermediate: {
    label: "Intermediate",
    description: "Regional powers and major countries",
    count: "51 countries",
    badgeColor: "bg-yellow-100 text-yellow-600",
    borderColor: "hover:border-yellow-500",
  },
  advanced: {
    label: "Advanced",
    description: "Smaller nations and island countries", 
    count: "25 countries",
    badgeColor: "bg-orange-100 text-orange-600",
    borderColor: "hover:border-orange-500",
  },
  expert: {
    label: "Expert",
    description: "Most challenging and obscure countries", 
    count: "87 countries",
    badgeColor: "bg-red-100 text-red-600",
    borderColor: "hover:border-red-500",
  },
};

export function DifficultySelector({ selectedDifficulty, onSelect }: DifficultySelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900">Select Difficulty Level</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
                  {data.label}
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
