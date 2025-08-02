import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProgressCard } from "@/components/progress-card";
import { StudyModeCard } from "@/components/study-mode-card";

import { AchievementItem } from "@/components/achievement-item";
import { 
  CheckCircle, 
  Flame, 
  BarChart3, 
  Clock, 
  Brain, 
  FileText, 
  Keyboard, 
  Map,
  Star,
  MapPin 
} from "lucide-react";
import { useState } from "react";
import { formatStudyTime } from "@/lib/utils";
import { countries } from "@/data/countries";
import { WorldMapPreview } from "@/components/world-map-preview";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  // Helper function to get country info by code
  const getCountryInfo = (countryCode: string) => {
    return countries.find(country => country.code === countryCode);
  };

  // Helper function to get flag emoji from country code
  const getCountryFlag = (countryCode: string) => {
    return countryCode
      .toUpperCase()
      .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)));
  };


  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const { data: achievements } = useQuery({
    queryKey: ["/api/user/achievements"],
  });

  const { data: dailyStats } = useQuery({
    queryKey: ["/api/user/daily-stats"],
  });

  const { data: reviewItems } = useQuery({
    queryKey: ["/api/user/review"],
  });

  const startStudyMode = (mode: string) => {
    // Navigate to difficulty selection for the chosen mode
    setLocation(`/difficulty-selection?mode=${mode}`);
  };

  const navigateToAnalytics = (view: string) => {
    setLocation(`/analytics-dashboard?view=${view}`);
  };

  const progressPercentage = ((dailyStats?.countriesLearned || 0) / 5) * 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Progress Overview */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Learning Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <ProgressCard
            title="Countries Mastered"
            value={stats?.totalCountriesMastered || 0}
            subtitle="of 195 total"
            icon={CheckCircle}
            iconColor="text-secondary"
            onClick={() => navigateToAnalytics('mastery')}
          />
          
          <ProgressCard
            title="Current Streak"
            value={stats?.currentStreak || 0}
            subtitle="days active"
            icon={Flame}
            iconColor="text-accent"
            valueColor="text-accent"
            onClick={() => navigateToAnalytics('streak')}
          />
          
          <ProgressCard
            title="Accuracy Rate"
            value={`${stats?.accuracyRate || 0}%`}
            subtitle="last 30 days"
            icon={BarChart3}
            iconColor="text-primary"
            valueColor="text-primary"
            onClick={() => navigateToAnalytics('accuracy')}
          />
          
          <ProgressCard
            title="Total Study Time"
            value={formatStudyTime(stats?.totalStudyTime || 0)}
            subtitle="this month"
            icon={Clock}
            iconColor="text-purple-600"
            onClick={() => navigateToAnalytics('study-time')}
          />
        </div>
      </div>

      {/* Featured: Smart Quiz */}
      <div className="mb-8">
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Brain className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">🧠 NEW: Smart Geography Quiz</h3>
                    <p className="text-sm text-blue-600 font-medium">AI-powered personalized learning</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">
                  Experience our revolutionary adaptive difficulty system that learns from your performance 
                  and provides the perfect challenge level for maximum learning efficiency.
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Personalized difficulty
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Real-time adaptation
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Performance tracking
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Button 
                  onClick={() => setLocation('/dynamic-quiz')}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Try Smart Quiz
                </Button>
                <p className="text-xs text-gray-500 mt-2">No difficulty selection needed!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Study Modes */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Traditional Study Modes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StudyModeCard
                title="Quick Quiz"
                description="Test your knowledge with rapid-fire questions. Perfect for quick practice sessions."
                icon={Brain}
                iconColor="text-primary"
                badge="Quick"
                badgeColor="bg-primary/10 text-primary"
                duration="5-10 minutes"
                onClick={() => startStudyMode("quiz")}
              />
              
              <StudyModeCard
                title="Flashcards"
                description="Study with interactive flashcards. Flip between countries and capitals at your own pace."
                icon={FileText}
                iconColor="text-accent"
                badge="Focus"
                badgeColor="bg-accent/10 text-accent"
                duration="Self-paced"
                onClick={() => startStudyMode("flashcards")}
              />
              
              <StudyModeCard
                title="Typing Practice"
                description="Type out country and capital names to improve spelling and memory retention."
                icon={Keyboard}
                iconColor="text-secondary"
                badge="Practice"
                badgeColor="bg-secondary/10 text-secondary"
                duration="10-15 minutes"
                onClick={() => startStudyMode("typing-practice")}
              />
              
              <StudyModeCard
                title="Map Challenge"
                description="Click on countries on an interactive world map and identify their capitals."
                icon={Map}
                iconColor="text-purple-600"
                badge="Visual"
                badgeColor="bg-purple-100 text-purple-600"
                duration="15-20 minutes"
                onClick={() => startStudyMode("map-challenge")}
              />
            </div>
          </div>


        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Today's Goal */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Goal</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Learn 5 new countries</span>
                  <span className="text-sm font-medium text-secondary">
                    {dailyStats?.countriesLearned || 3}/5
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <p className="text-xs text-gray-500">
                  {5 - (dailyStats?.countriesLearned || 3)} more to reach your daily goal!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h3>
              <div className="space-y-3">
                {achievements?.slice(0, 3).map((achievement) => (
                  <AchievementItem key={achievement.id} achievement={achievement} />
                ))}
                {!achievements?.length && (
                  <p className="text-sm text-gray-500">Complete your first quiz to earn achievements!</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* World Map Preview */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">World Map</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => startStudyMode("map-challenge")}
                >
                  View Full
                </Button>
              </div>
              <div className="relative">
                <div className="w-full h-40 rounded-lg overflow-hidden">
                  <WorldMapPreview className="w-full h-full" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Need Review */}
          {reviewItems && reviewItems.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Review</h3>
                <div className="space-y-3">
                  {reviewItems.slice(0, 3).map((item: any) => {
                    const countryInfo = getCountryInfo(item.countryCode);
                    const flag = getCountryFlag(item.countryCode);
                    
                    return (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl" role="img" aria-label={`${countryInfo?.name || item.countryCode} flag`}>
                            {flag}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {countryInfo?.name || item.countryCode}
                            </p>
                            <p className="text-xs text-gray-500">
                              Capital: {countryInfo?.capital || 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                      </div>
                    );
                  })}
                </div>
                {reviewItems.length > 3 && (
                  <Button variant="ghost" className="w-full mt-4" size="sm">
                    Review All ({reviewItems.length} items)
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Start CTA */}
      <div className="mt-12 bg-gradient-to-r from-primary to-primary/80 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Ready to Continue Learning?</h2>
        <p className="text-blue-100 mb-6">Jump back into your last study session or start a new challenge.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            className="bg-white text-primary hover:bg-gray-50" 
            onClick={() => startStudyMode("quiz")}
          >
            Start Quick Quiz
          </Button>
          <Button 
            variant="outline" 
            className="border-white text-white hover:bg-white/10"
            onClick={() => startStudyMode("dynamic-quiz")}
          >
            Try Smart Quiz
          </Button>
        </div>
      </div>
    </div>
  );
}
