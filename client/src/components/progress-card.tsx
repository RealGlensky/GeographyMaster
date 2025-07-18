import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ProgressCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  iconColor: string;
  valueColor?: string;
  onClick?: () => void;
}

export function ProgressCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  iconColor, 
  valueColor = "text-gray-900",
  onClick
}: ProgressCardProps) {
  return (
    <Card 
      className={`${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
          <div className={`w-12 h-12 ${iconColor}/10 rounded-lg flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
