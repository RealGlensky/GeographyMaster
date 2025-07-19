import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe2, Target, TrendingUp, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <Globe2 className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">WorldCap</h1>
            </div>
            <Link href="/login">
              <Button size="lg">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Master World Geography
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Learn country capitals through interactive quizzes, flashcards, and personalized learning experiences. 
            Track your progress and master geography with our AI-powered adaptive system.
          </p>
          <Link href="/login">
            <Button size="lg" className="text-lg px-8 py-4">
              Start Learning Now
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Target className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Smart Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                AI-powered quizzes that adapt to your learning pace and focus on areas that need improvement.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Progress Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Detailed analytics showing your mastery levels, streaks, and learning patterns over time.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Globe2 className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Multiple Modes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Choose from quizzes, flashcards, typing practice, and interactive map challenges.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>Personal Learning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Personalized difficulty recommendations based on your performance and learning goals.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Learning Modes Preview */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h3 className="text-3xl font-bold text-center mb-8">Learning Modes</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-lg bg-blue-50">
              <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-2">Quiz Mode</h4>
              <p className="text-sm text-gray-600">Multiple choice questions with instant feedback</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-green-50">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Globe2 className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-semibold mb-2">Flashcards</h4>
              <p className="text-sm text-gray-600">Interactive flip cards for self-paced learning</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-purple-50">
              <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-2">Typing Practice</h4>
              <p className="text-sm text-gray-600">Improve accuracy with typing challenges</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-orange-50">
              <div className="w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Users className="w-8 h-8 text-orange-600" />
              </div>
              <h4 className="font-semibold mb-2">Map Challenge</h4>
              <p className="text-sm text-gray-600">Visual geography learning with interactive maps</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Master World Geography?</h3>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of learners who have improved their geography knowledge with WorldCap.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-4">
                Start Your Journey
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}