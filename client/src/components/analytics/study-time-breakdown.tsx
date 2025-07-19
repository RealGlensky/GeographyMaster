import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Calendar, BarChart3, TrendingUp } from "lucide-react";
import { GoalsManager } from "./goals-manager";

export function StudyTimeBreakdown() {
  const [selectedPeriod, setSelectedPeriod] = useState('daily');

  const { data: timeData, isLoading } = useQuery({
    queryKey: ["/api/user/study-time-breakdown", selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/user/study-time-breakdown?period=${selectedPeriod}`);
      if (!response.ok) throw new Error('Failed to fetch study time breakdown');
      return response.json();
    }
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
              <div className="h-64 bg-gray-300 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const breakdown = timeData || [];
  const totalStudyTime = userStats?.totalStudyTime || 0;
  const currentPeriodTotal = breakdown.reduce((sum, item) => sum + item.studyTime, 0);
  const currentPeriodSessions = breakdown.reduce((sum, item) => sum + item.sessionsCount, 0);
  const averagePerPeriod = breakdown.length > 0 ? Math.round(currentPeriodTotal / breakdown.length) : 0;

  const maxTime = Math.max(...breakdown.map(item => item.studyTime), 1);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      default: return 'Overall';
    }
  };

  const getPeriodIcon = (period: string) => {
    switch (period) {
      case 'daily': return '📅';
      case 'weekly': return '📊';
      case 'monthly': return '📈';
      case 'yearly': return '🗓️';
      default: return '⏱️';
    }
  };

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Study Time Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-6">
            {['daily', 'weekly', 'monthly', 'yearly'].map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "default" : "outline"}
                onClick={() => setSelectedPeriod(period)}
                className="capitalize"
              >
                {getPeriodIcon(period)} {getPeriodLabel(period)}
              </Button>
            ))}
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {formatTime(totalStudyTime)}
              </div>
              <div className="text-sm text-blue-700">Total All Time</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {formatTime(currentPeriodTotal)}
              </div>
              <div className="text-sm text-green-700">This Period</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {formatTime(averagePerPeriod)}
              </div>
              <div className="text-sm text-purple-700">
                Avg per {selectedPeriod.slice(0, -2)}
              </div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {currentPeriodSessions}
              </div>
              <div className="text-sm text-orange-700">Sessions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            {getPeriodLabel(selectedPeriod)} Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {breakdown.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <div className="text-lg font-medium mb-2">No study data available</div>
              <div className="text-sm">
                Start learning to see your study time patterns!
              </div>
            </div>
          ) : (
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {breakdown.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-20 text-sm font-medium text-gray-700">
                      {item.period}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {formatTime(item.studyTime)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {item.sessionsCount} session{item.sessionsCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${(item.studyTime / maxTime) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-16 text-right">
                      <Badge variant="outline" className="text-xs">
                        {item.studyTime > 0 ? Math.round((item.studyTime / currentPeriodTotal) * 100) : 0}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Insights and Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Study Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentPeriodTotal > 0 ? (
                <>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="font-medium text-green-800 mb-1">Most Productive</div>
                    <div className="text-sm text-green-700">
                      {breakdown.reduce((best, current) => 
                        current.studyTime > best.studyTime ? current : best, 
                        breakdown[0]
                      )?.period} - {formatTime(Math.max(...breakdown.map(b => b.studyTime)))}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-800 mb-1">Consistency Score</div>
                    <div className="text-sm text-blue-700">
                      {breakdown.filter(b => b.studyTime > 0).length} out of {breakdown.length} periods active
                    </div>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="font-medium text-purple-800 mb-1">Average Session</div>
                    <div className="text-sm text-purple-700">
                      {currentPeriodSessions > 0 ? formatTime(Math.round(currentPeriodTotal / currentPeriodSessions)) : '0m'} per session
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Complete some learning sessions to see insights!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <GoalsManager />
      </div>
    </div>
  );
}