import { Achievement } from "@shared/schema";
import { Star, CheckCircle, TrendingUp } from "lucide-react";

interface AchievementItemProps {
  achievement: Achievement;
}

const getAchievementIcon = (type: string) => {
  switch (type) {
    case 'streak':
      return Star;
    case 'mastery':
      return CheckCircle;
    case 'speed':
      return TrendingUp;
    default:
      return Star;
  }
};

const getAchievementColor = (type: string) => {
  switch (type) {
    case 'streak':
      return 'text-accent bg-accent/10';
    case 'mastery':
      return 'text-secondary bg-secondary/10';
    case 'speed':
      return 'text-primary bg-primary/10';
    default:
      return 'text-accent bg-accent/10';
  }
};

export function AchievementItem({ achievement }: AchievementItemProps) {
  const Icon = getAchievementIcon(achievement.type);
  const colorClass = getAchievementColor(achievement.type);

  return (
    <div className="flex items-center space-x-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">{achievement.title}</p>
        <p className="text-xs text-gray-500">{achievement.description}</p>
      </div>
    </div>
  );
}
