import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Flame, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export function StreakCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Format date for API call (YYYY-MM format)
  const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  const { data: streakData, isLoading } = useQuery({
    queryKey: ["/api/user/streak-calendar", monthKey],
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const monthName = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
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
  
  // Generate full month calendar
  const generateMonthCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from Sunday of the week containing the first day
    const calendarStart = new Date(firstDay);
    calendarStart.setDate(firstDay.getDate() - firstDay.getDay());
    
    // Generate 6 weeks (42 days) to cover the full month view
    const weeks = [];
    let currentWeek = [];
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(calendarStart);
      date.setDate(calendarStart.getDate() + i);
      
      const dateStr = date.toISOString().split('T')[0];
      const dayData = calendarData.find(d => d.date === dateStr);
      
      // Check if this date is in the current month
      const isCurrentMonth = date.getMonth() === month;
      
      currentWeek.push({
        date: dateStr,
        dayNumber: date.getDate(),
        isCurrentMonth,
        hasActivity: dayData?.hasActivity || false,
        studyTime: dayData?.studyTime || 0,
        questionsAnswered: dayData?.questionsAnswered || 0
      });
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    return weeks;
  };

  const weeks = generateMonthCalendar();

  // Calculate stats for current month only
  const monthData = calendarData.filter(day => {
    const dayDate = new Date(day.date);
    return dayDate.getMonth() === currentDate.getMonth() && 
           dayDate.getFullYear() === currentDate.getFullYear();
  });
  
  const activeDays = monthData.filter(day => day.hasActivity).length;
  const totalStudyTime = monthData.reduce((sum, day) => sum + day.studyTime, 0);
  const averageSessionTime = activeDays > 0 ? Math.round(totalStudyTime / activeDays) : 0;
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

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
              out of {daysInMonth} days this month
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
            <span>Monthly Activity Calendar</span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                disabled={isLoading}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Badge variant="outline" className="px-3 py-1">
                {monthName}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                disabled={isLoading}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
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
                    const activityLevel = getActivityLevel(day.studyTime);
                    const isToday = new Date(day.date).toDateString() === new Date().toDateString();
                    const isCurrentMonth = day.isCurrentMonth;

                    return (
                      <div
                        key={day.date}
                        className={`
                          h-10 border-2 rounded-lg flex items-center justify-center text-sm font-medium cursor-pointer
                          transition-all hover:scale-105 hover:shadow-md
                          ${getActivityColor(activityLevel)}
                          ${!isCurrentMonth ? 'opacity-30' : ''}
                          ${isToday ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                        `}
                        title={`${new Date(day.date).toLocaleDateString()}: ${day.studyTime} minutes${day.questionsAnswered ? `, ${day.questionsAnswered} questions` : ''}`}
                      >
                        <span className={`${
                          !isCurrentMonth ? 'text-gray-300' :
                          activityLevel === 'none' ? 'text-gray-400' : 'text-gray-700'
                        }`}>
                          {day.dayNumber}
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
                  {monthData.filter(d => d.studyTime === 0).length}
                </div>
                <div className="text-xs text-gray-500">No activity</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {monthData.filter(d => d.studyTime > 0 && d.studyTime < 15).length}
                </div>
                <div className="text-xs text-gray-500">Light (1-14 min)</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-700">
                  {monthData.filter(d => d.studyTime >= 15 && d.studyTime < 30).length}
                </div>
                <div className="text-xs text-gray-500">Medium (15-29 min)</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-800">
                  {monthData.filter(d => d.studyTime >= 30).length}
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