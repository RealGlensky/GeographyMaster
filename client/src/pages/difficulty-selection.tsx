import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Brain, FileText, Keyboard, Map, Globe, Star, Zap } from "lucide-react";
import { Difficulty } from "@shared/schema";

const studyModeInfo = {
  "quiz": {
    title: "Quick Quiz",
    description: "Test your knowledge with rapid-fire questions",
    icon: Brain,
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  "flashcards": {
    title: "Flashcards",
    description: "Study with interactive flashcards at your own pace",
    icon: FileText,
    color: "text-accent",
    bgColor: "bg-accent/10"
  },
  "typing-practice": {
    title: "Typing Practice",
    description: "Type out country and capital names",
    icon: Keyboard,
    color: "text-secondary",
    bgColor: "bg-secondary/10"
  },
  "map-challenge": {
    title: "Map Challenge",
    description: "Click on countries on an interactive world map",
    icon: Map,
    color: "text-purple-600",
    bgColor: "bg-purple-100"
  },
  "dynamic-quiz": {
    title: "Smart Geography Quiz",
    description: "AI-powered personalized learning",
    icon: Brain,
    color: "text-blue-600",
    bgColor: "bg-blue-100"
  }
};

const difficultyLevels = [
  {
    level: "beginner" as Difficulty,
    title: "Beginner",
    description: "Most famous countries and capitals",
    countries: "27 countries",
    badge: "Perfect for starting out",
    badgeColor: "bg-green-100 text-green-600",
    icon: Globe,
    iconColor: "text-green-600"
  },
  {
    level: "easy" as Difficulty,
    title: "Easy", 
    description: "Well-known countries worldwide",
    countries: "36 countries",
    badge: "Building confidence",
    badgeColor: "bg-blue-100 text-blue-600",
    icon: Star,
    iconColor: "text-blue-600"
  },
  {
    level: "intermediate" as Difficulty,
    title: "Intermediate",
    description: "Regional powers and major countries",
    countries: "51 countries",
    badge: "Great for building knowledge",
    badgeColor: "bg-yellow-100 text-yellow-600",
    icon: Star,
    iconColor: "text-yellow-600"
  },
  {
    level: "advanced" as Difficulty,
    title: "Advanced",
    description: "Smaller nations and island countries", 
    countries: "25 countries",
    badge: "Challenging territory",
    badgeColor: "bg-orange-100 text-orange-600",
    icon: Zap,
    iconColor: "text-orange-600"
  },
  {
    level: "expert" as Difficulty,
    title: "Expert",
    description: "Most challenging and obscure countries", 
    countries: "87 countries",
    badge: "Ultimate challenge",
    badgeColor: "bg-red-100 text-red-600",
    icon: Zap,
    iconColor: "text-red-600"
  }
];

export default function DifficultySelection() {
  const [, setLocation] = useLocation();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  
  // Get mode from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get("mode") || "quiz";
  
  const modeInfo = studyModeInfo[mode as keyof typeof studyModeInfo] || studyModeInfo.quiz;
  const ModeIcon = modeInfo.icon;

  const handleBack = () => {
    setLocation("/");
  };

  const handleStart = () => {
    if (!selectedDifficulty) return;
    
    if (mode === "dynamic-quiz") {
      setLocation("/dynamic-quiz");
    } else {
      setLocation(`/${mode}?difficulty=${selectedDifficulty}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-16 h-16 ${modeInfo.bgColor} rounded-xl flex items-center justify-center`}>
              <ModeIcon className={`w-8 h-8 ${modeInfo.color}`} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{modeInfo.title}</h1>
              <p className="text-gray-600">{modeInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Choose Your Difficulty Level</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {difficultyLevels.map((difficulty) => {
              const DifficultyIcon = difficulty.icon;
              const isSelected = selectedDifficulty === difficulty.level;
              
              return (
                <Card 
                  key={difficulty.level}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedDifficulty(difficulty.level)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 ${difficulty.iconColor}/10 rounded-lg flex items-center justify-center`}>
                        <DifficultyIcon className={`w-6 h-6 ${difficulty.iconColor}`} />
                      </div>
                      <Badge className={difficulty.badgeColor}>
                        {difficulty.badge}
                      </Badge>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {difficulty.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {difficulty.description}
                    </p>
                    <p className="text-sm font-medium text-gray-700">
                      {difficulty.countries}
                    </p>
                    
                    {isSelected && (
                      <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                        <p className="text-primary text-sm font-medium">
                          ✓ Selected
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Start Button */}
        <div className="text-center">
          <Button
            onClick={handleStart}
            disabled={!selectedDifficulty}
            size="lg"
            className="px-8 py-3 text-lg"
          >
            {selectedDifficulty ? `Start ${modeInfo.title}` : "Select a difficulty level"}
          </Button>
        </div>
      </div>
    </div>
  );
}