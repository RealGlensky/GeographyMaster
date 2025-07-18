import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { MasteryDetails } from "@/components/analytics/mastery-details";
import { StreakCalendar } from "@/components/analytics/streak-calendar";
import { AccuracyDetails } from "@/components/analytics/accuracy-details";
import { StudyTimeBreakdown } from "@/components/analytics/study-time-breakdown";

export default function AnalyticsDashboard() {
  const [, navigate] = useLocation();
  const [activeView, setActiveView] = useState<string | null>(null);

  // Get the view from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const viewFromUrl = urlParams.get('view');
  
  if (viewFromUrl && !activeView) {
    setActiveView(viewFromUrl);
  }

  const handleViewChange = (view: string) => {
    setActiveView(view);
    navigate(`/analytics-dashboard?view=${view}`);
  };

  const handleBackToDashboard = () => {
    setActiveView(null);
    navigate('/analytics-dashboard');
  };

  const handleBackToMain = () => {
    navigate('/dashboard');
  };

  if (activeView) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={handleBackToDashboard}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Analytics
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 capitalize">
                {activeView.replace('-', ' ')} Details
              </h1>
              <p className="text-gray-600">Detailed analysis of your learning progress</p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {activeView === 'mastery' && <MasteryDetails />}
            {activeView === 'streak' && <StreakCalendar />}
            {activeView === 'accuracy' && <AccuracyDetails />}
            {activeView === 'study-time' && <StudyTimeBreakdown />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={handleBackToMain}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Learning Analytics</h1>
            <p className="text-gray-600">Choose a category to view detailed insights</p>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleViewChange('mastery')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Countries Mastered
                <Badge variant="secondary">📚</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                View detailed breakdown of mastered and unmastered countries with progress tracking.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Alphabetical list with flags</li>
                <li>• Mastery levels and attempt history</li>
                <li>• Blurred capitals for unmastered countries</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleViewChange('streak')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Learning Streak
                <Badge variant="secondary">🔥</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Calendar view showing your daily learning activity and streak maintenance.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• 30-day calendar view</li>
                <li>• Daily study time tracking</li>
                <li>• Activity patterns visualization</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleViewChange('accuracy')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Accuracy Analysis
                <Badge variant="secondary">🎯</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Detailed accuracy breakdown by difficulty, study mode, and problem areas.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Performance by difficulty level</li>
                <li>• Study mode comparison</li>
                <li>• Countries needing improvement</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleViewChange('study-time')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Study Time Analytics
                <Badge variant="secondary">⏱️</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Comprehensive study time breakdown with multiple time period views.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Daily, weekly, monthly views</li>
                <li>• Session count tracking</li>
                <li>• Apple Screen Time style dashboard</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}