import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface StudyModeCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  badge: string;
  badgeColor: string;
  duration: string;
  onClick: () => void;
}

export function StudyModeCard({
  title,
  description,
  icon: Icon,
  iconColor,
  badge,
  badgeColor,
  duration,
  onClick,
}: StudyModeCardProps) {
  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 ${iconColor}/10 rounded-lg flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          <Badge variant="secondary" className={`${badgeColor} font-medium`}>
            {badge}
          </Badge>
        </div>
        
        <h4 className="text-lg font-semibold text-gray-900 mb-2">{title}</h4>
        <p className="text-gray-600 text-sm mb-4">{description}</p>
        
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="w-4 h-4 mr-1" />
          {duration}
        </div>
      </CardContent>
    </Card>
  );
}
