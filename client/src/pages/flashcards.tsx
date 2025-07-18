import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Difficulty, Country, User } from "@shared/schema";
import { getCountriesByDifficulty } from "@/data/countries";

interface FlashcardData {
  country: Country;
  showAnswer: boolean;
}

export default function Flashcards() {
  const [, setLocation] = useLocation();
  const [urlParams] = useState(() => new URLSearchParams(window.location.search));
  const difficulty = (urlParams.get("difficulty") || "beginner") as Difficulty;
  
  // Get user data for excluded countries
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });
  
  const [countries, setCountries] = useState<Country[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flashcard, setFlashcard] = useState<FlashcardData | null>(null);
  const [studiedCards, setStudiedCards] = useState(new Set<number>());

  // Update countries when user data loads
  useEffect(() => {
    const excludedCountries = user?.excludedCountries || [];
    const availableCountries = getCountriesByDifficulty(difficulty, excludedCountries);
    setCountries(availableCountries);
    if (availableCountries.length > 0) {
      setFlashcard({
        country: availableCountries[0],
        showAnswer: false,
      });
    }
  }, [user, difficulty]);

  useEffect(() => {
    if (countries.length > 0 && countries[currentIndex]) {
      setFlashcard({
        country: countries[currentIndex],
        showAnswer: false,
      });
    }
  }, [currentIndex, countries]);

  const handleClose = () => {
    setLocation("/");
  };

  const flipCard = () => {
    if (!flashcard) return;
    setFlashcard(prev => prev ? { ...prev, showAnswer: !prev.showAnswer } : null);
    if (flashcard && !flashcard.showAnswer) {
      setStudiedCards(prev => new Set(prev).add(currentIndex));
    }
  };

  const nextCard = () => {
    if (currentIndex < countries.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const resetSession = () => {
    setCurrentIndex(0);
    setStudiedCards(new Set());
    setFlashcard({
      country: countries[0],
      showAnswer: false,
    });
  };

  const studiedPercentage = (studiedCards.size / countries.length) * 100;

  // Show loading or empty state
  if (!flashcard || countries.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            {countries.length === 0 ? "No countries available" : "Loading..."}
          </h2>
          <p className="text-gray-600 mb-4">
            {countries.length === 0 
              ? "All countries for this difficulty level have been excluded from your learning plan." 
              : "Setting up your flashcards..."
            }
          </p>
          <Button onClick={handleClose}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Flashcards</h1>
              <p className="text-gray-600 capitalize">{difficulty} Level</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline">
              {currentIndex + 1} / {countries.length}
            </Badge>
            <Badge variant="secondary">
              {studiedCards.size} studied
            </Badge>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(studiedPercentage)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${studiedPercentage}%` }}
            />
          </div>
        </div>

        {/* Flashcard */}
        <div className="mb-6">
          <div className={`flip-card w-full h-80 ${flashcard.showAnswer ? 'flipped' : ''}`}>
            <div className="flip-card-inner">
              {/* Front of card */}
              <Card className="flip-card-front cursor-pointer" onClick={flipCard}>
                <CardContent className="h-80 flex flex-col items-center justify-center p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-primary">
                        {flashcard.country?.name.charAt(0)}
                      </span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      {flashcard.country?.name}
                    </h2>
                    <p className="text-gray-500 mb-6">What is the capital?</p>
                    <p className="text-sm text-gray-400">Click to reveal</p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Back of card */}
              <Card className="flip-card-back cursor-pointer" onClick={flipCard}>
                <CardContent className="h-80 flex flex-col items-center justify-center p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-secondary">★</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-600 mb-2">
                      {flashcard.country?.name}
                    </h2>
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">
                      {flashcard.country?.capital}
                    </h3>
                    <Badge variant="outline" className="mb-4">
                      {flashcard.country?.continent}
                    </Badge>
                    <p className="text-sm text-gray-400">Click to flip back</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={prevCard}
            disabled={currentIndex === 0}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={resetSession}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button onClick={flipCard}>
              {flashcard.showAnswer ? "Show Question" : "Show Answer"}
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={nextCard}
            disabled={currentIndex === countries.length - 1}
            className="flex items-center space-x-2"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Session Summary */}
        {studiedCards.size === countries.length && (
          <Card className="mt-6 border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Congratulations! 🎉
              </h3>
              <p className="text-green-600 mb-4">
                You've studied all {countries.length} flashcards for {difficulty} level!
              </p>
              <div className="flex justify-center space-x-4">
                <Button onClick={resetSession} variant="outline">
                  Study Again
                </Button>
                <Button onClick={handleClose}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
