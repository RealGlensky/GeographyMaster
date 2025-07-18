import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Flame, Clock } from "lucide-react";

export function StreakCalendar() {
  const { data: streakData, isLoading } = useQuery({
    queryKey: ["/api/user/streak-calendar"],
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

  const calendarData = streakData || [];
  const currentStreak = userStats?.currentStreak || 0;
  
  // Group by weeks for calendar display
  const weeks = [];
  let currentWeek = [];
  const startDate = new Date(calendarData[0]?.date || new Date());
  
  // Add empty days at the beginning to align with week start
  const dayOfWeek = startDate.getDay();
  for (let i = 0; i < dayOfWeek; i++) {
    currentWeek.push(null);
  }
  
  calendarData.forEach((day, index) => {
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  });
  
  if (currentWeek.length > 0) {
    // Fill remaining days
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  const activeDays = calendarData.filter(day => day.hasActivity).length;
  const totalStudyTime = calendarData.reduce((sum, day) => sum + day.studyTime, 0);
  const averageSessionTime = activeDays > 0 ? Math.round(totalStudyTime / activeDays) : 0;

  const getActivityLevel = (studyTime: number) => {
    if (studyTime === 0) return 'none';
    if (studyTime < 5) return 'low';
    if (studyTime < 15) return 'medium';
    if (studyTime < 30) return 'high';
    return 'very-high';
  };

  const getActivityColor = (level: string) => {
    switch (level) {
      case 'none': return 'bg-gray-100 border-gray-200';
      case 'low': return 'bg-green-100 border-green-200';
      case 'medium': return 'bg-green-200 border-green-300';
      case 'high': return 'bg-green-400 border-green-500';
      case 'very-high': return 'bg-green-600 border-green-700';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flame className="w-5 h-5 text-orange-500" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 mb-2">{currentStreak}</div>
            <div className="text-sm text-gray-600">
              {currentStreak === 1 ? 'day' : 'days'} in a row
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-blue-500" />
              Active Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-2">{activeDays}</div>
            <div className="text-sm text-gray-600">
              out of last 30 days
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-green-500" />
              Avg Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">{averageSessionTime}</div>
            <div className="text-sm text-gray-600">
              minutes per active day
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>30-Day Activity Calendar</span>
            <Badge variant="outline">Last 30 Days</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-gray-600">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-2">{day}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="space-y-2">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-2">
                  {week.map((day, dayIndex) => {
                    if (!day) {
                      return <div key={dayIndex} className="h-10"></div>;
                    }

                    const date = new Date(day.date);
                    const dayNumber = date.getDate();
                    const activityLevel = getActivityLevel(day.studyTime);
                    const isToday = date.toDateString() === new Date().toDateString();

                    return (
                      <div
                        key={day.date}
                        className={`
                          h-10 border-2 rounded-lg flex items-center justify-center text-sm font-medium cursor-pointer
                          transition-all hover:scale-105 hover:shadow-md
                          ${getActivityColor(activityLevel)}
                          ${isToday ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                        `}
                        title={`${date.toLocaleDateString()}: ${day.studyTime} minutes`}
                      >
                        <span className={`${activityLevel === 'none' ? 'text-gray-400' : 'text-gray-700'}`}>
                          {dayNumber}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-600">
                Less activity
              </div>
              <div className="flex items-center gap-1">
                {['none', 'low', 'medium', 'high', 'very-high'].map(level => (
                  <div
                    key={level}
                    className={`w-3 h-3 border rounded ${getActivityColor(level)}`}
                  />
                ))}
              </div>
              <div className="text-sm text-gray-600">
                More activity
              </div>
            </div>

            {/* Activity Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-700">
                  {calendarData.filter(d => d.studyTime === 0).length}
                </div>
                <div className="text-xs text-gray-500">No activity</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {calendarData.filter(d => d.studyTime > 0 && d.studyTime < 15).length}
                </div>
                <div className="text-xs text-gray-500">Light (1-14 min)</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-700">
                  {calendarData.filter(d => d.studyTime >= 15 && d.studyTime < 30).length}
                </div>
                <div className="text-xs text-gray-500">Medium (15-29 min)</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-800">
                  {calendarData.filter(d => d.studyTime >= 30).length}
                </div>
                <div className="text-xs text-gray-500">Heavy (30+ min)</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}