import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, CheckCircle, XCircle, MapPin, Globe } from "lucide-react";
import { Difficulty, Country } from "@shared/schema";
import { getCountriesByDifficulty } from "@/data/countries";

interface MapRegion {
  id: string;
  name: string;
  country: Country;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function MapChallenge() {
  const [, setLocation] = useLocation();
  const [urlParams] = useState(() => new URLSearchParams(window.location.search));
  const difficulty = (urlParams.get("difficulty") || "beginner") as Difficulty;
  
  const [countries] = useState(() => getCountriesByDifficulty(difficulty).slice(0, 15));
  const [currentCountryIndex, setCurrentCountryIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  
  const currentCountry = countries[currentCountryIndex];
  
  // Mock map regions for demonstration
  const mapRegions: MapRegion[] = countries.map((country, index) => ({
    id: country.code,
    name: country.name,
    country,
    x: 50 + (index % 5) * 100,
    y: 50 + Math.floor(index / 5) * 80,
    width: 80,
    height: 60,
  }));

  const handleClose = () => {
    setLocation("/");
  };

  const handleRegionClick = (regionId: string) => {
    if (isAnswered) return;
    
    setSelectedRegion(regionId);
    const correct = regionId === currentCountry.code;
    setIsCorrect(correct);
    setIsAnswered(true);
    
    if (correct) {
      setScore(prev => prev + 1);
    }
    
    setTimeout(() => {
      if (currentCountryIndex < countries.length - 1) {
        setCurrentCountryIndex(prev => prev + 1);
        setSelectedRegion(null);
        setIsAnswered(false);
        setUserAnswer("");
      } else {
        setSessionComplete(true);
      }
    }, 2000);
  };

  const handleAnswerSubmit = () => {
    if (isAnswered || !userAnswer.trim()) return;
    
    const correct = userAnswer.toLowerCase().trim() === currentCountry.capital.toLowerCase().trim();
    setIsCorrect(correct);
    setIsAnswered(true);
    
    if (correct) {
      setScore(prev => prev + 1);
    }
    
    setTimeout(() => {
      if (currentCountryIndex < countries.length - 1) {
        setCurrentCountryIndex(prev => prev + 1);
        setIsAnswered(false);
        setUserAnswer("");
      } else {
        setSessionComplete(true);
      }
    }, 2000);
  };

  const handleRestart = () => {
    setCurrentCountryIndex(0);
    setUserAnswer("");
    setIsAnswered(false);
    setIsCorrect(false);
    setScore(0);
    setSessionComplete(false);
    setSelectedRegion(null);
  };

  if (sessionComplete) {
    const accuracy = Math.round((score / countries.length) * 100);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              {accuracy >= 80 ? (
                <CheckCircle className="w-16 h-16 text-secondary mx-auto mb-4" />
              ) : (
                <XCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              )}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Map Challenge Complete!</h2>
              <p className="text-gray-600">You scored {score} out of {countries.length}</p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Accuracy</span>
                <span className="font-semibold">{accuracy}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Difficulty</span>
                <Badge variant="secondary" className="capitalize">{difficulty}</Badge>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button onClick={handleRestart} className="flex-1">
                Try Again
              </Button>
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Map Challenge</h1>
              <p className="text-gray-600 capitalize">{difficulty} Level</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline">
              {currentCountryIndex + 1} / {countries.length}
            </Badge>
            <Badge variant="secondary">
              Score: {score}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Area */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">World Map</h3>
                  <Globe className="w-5 h-5 text-gray-500" />
                </div>
                
                {/* Interactive Map */}
                <div className="relative bg-blue-50 rounded-lg border-2 border-blue-200 min-h-[400px] overflow-hidden">
                  <svg
                    viewBox="0 0 600 400"
                    className="w-full h-full"
                  >
                    {mapRegions.map((region) => {
                      let fillColor = "#e5e7eb"; // default gray
                      let strokeColor = "#9ca3af";
                      
                      if (isAnswered && region.id === currentCountry.code) {
                        fillColor = "#10b981"; // correct answer - green
                        strokeColor = "#059669";
                      } else if (selectedRegion === region.id && !isCorrect) {
                        fillColor = "#ef4444"; // wrong selection - red
                        strokeColor = "#dc2626";
                      } else if (selectedRegion === region.id) {
                        fillColor = "#3b82f6"; // selected - blue
                        strokeColor = "#2563eb";
                      }
                      
                      return (
                        <rect
                          key={region.id}
                          x={region.x}
                          y={region.y}
                          width={region.width}
                          height={region.height}
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth="2"
                          rx="4"
                          className="cursor-pointer hover:opacity-80 transition-all map-country"
                          onClick={() => handleRegionClick(region.id)}
                        />
                      );
                    })}
                    
                    {/* Country labels for reference */}
                    {mapRegions.map((region) => (
                      <text
                        key={`label-${region.id}`}
                        x={region.x + region.width / 2}
                        y={region.y + region.height / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="10"
                        fill="#374151"
                        className="pointer-events-none select-none"
                      >
                        {region.name.substring(0, 8)}
                      </text>
                    ))}
                  </svg>
                  
                  {/* Map legend */}
                  <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-lg">
                    <div className="flex space-x-4 text-xs">
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-gray-300 rounded"></div>
                        <span>Countries</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span>Correct</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span>Incorrect</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Panel */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Find: {currentCountry?.name}
                  </h3>
                  <Badge variant="outline">{currentCountry?.continent}</Badge>
                </div>
                
                <p className="text-gray-600 text-center mb-4">
                  Click on the country on the map
                </p>
                
                {isAnswered && (
                  <div className="text-center">
                    {isCorrect ? (
                      <div className="text-green-600">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                        <p className="font-medium">Correct!</p>
                      </div>
                    ) : (
                      <div className="text-red-600">
                        <XCircle className="w-8 h-8 mx-auto mb-2" />
                        <p className="font-medium">Try again next time!</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Capital Question */}
            <Card>
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  What is the capital of {currentCountry?.name}?
                </h4>
                
                <div className="space-y-4">
                  <Input
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type the capital city..."
                    className={isAnswered 
                      ? isCorrect 
                        ? "border-green-500 bg-green-50" 
                        : "border-red-500 bg-red-50"
                      : ""
                    }
                    disabled={isAnswered}
                    onKeyPress={(e) => e.key === "Enter" && handleAnswerSubmit()}
                  />
                  
                  {isAnswered && !isCorrect && (
                    <p className="text-red-600 text-sm">
                      Correct answer: {currentCountry?.capital}
                    </p>
                  )}
                  
                  <Button 
                    onClick={handleAnswerSubmit}
                    disabled={isAnswered || !userAnswer.trim()}
                    className="w-full"
                  >
                    Submit Answer
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Progress */}
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(((currentCountryIndex + (isAnswered ? 1 : 0)) / countries.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentCountryIndex + (isAnswered ? 1 : 0)) / countries.length) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
