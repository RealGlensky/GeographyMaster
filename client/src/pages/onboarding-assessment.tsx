import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Brain, CheckCircle, Globe, Sparkles } from "lucide-react";
import { getDiverseAssessmentCountries } from "@shared/geographic-proximity";
import { countries as allCountries } from "@/data/countries";
import type { Country, User } from "@shared/schema";

interface AssessmentQuestion {
  country: Country;
  type: 'country-to-capital' | 'capital-to-country';
  question: string;
  correctAnswer: string;
  options: string[];
}

interface AssessmentResult {
  countryCode: string;
  isCorrect: boolean;
  responseTime: number;
}

export default function OnboardingAssessment() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<'intro' | 'assessment' | 'processing' | 'complete'>('intro');
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const processAssessmentMutation = useMutation({
    mutationFn: async (assessmentResults: AssessmentResult[]) => {
      const response = await apiRequest("POST", "/api/user/process-assessment", {
        assessmentResults,
        homeCountry: user?.homeCountry
      });
      return response.json();
    },
    onSuccess: async () => {
      await apiRequest("POST", "/api/user/complete-onboarding", {});
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setStep('complete');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process assessment. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (step === 'assessment' && questions.length === 0) {
      generateQuestions();
    }
  }, [step]);

  const generateQuestions = () => {
    const assessmentCountries = getDiverseAssessmentCountries(allCountries, 25);
    
    const newQuestions: AssessmentQuestion[] = assessmentCountries.map(country => {
      const isCountryToCapital = Math.random() > 0.5;
      
      const otherCountries = allCountries
        .filter(c => c.code !== country.code)
        .sort(() => Math.random() - 0.5);
      
      if (isCountryToCapital) {
        const wrongOptions = otherCountries.slice(0, 3).map(c => c.capital);
        const options = [country.capital, ...wrongOptions].sort(() => Math.random() - 0.5);
        
        return {
          country,
          type: 'country-to-capital',
          question: `What is the capital of ${country.name}?`,
          correctAnswer: country.capital,
          options
        };
      } else {
        const wrongOptions = otherCountries.slice(0, 3).map(c => c.name);
        const options = [country.name, ...wrongOptions].sort(() => Math.random() - 0.5);
        
        return {
          country,
          type: 'capital-to-country',
          question: `Which country has ${country.capital} as its capital?`,
          correctAnswer: country.name,
          options
        };
      }
    });
    
    setQuestions(newQuestions);
    setQuestionStartTime(Date.now());
  };

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer) return;
    
    setSelectedAnswer(answer);
    const responseTime = Date.now() - questionStartTime;
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;
    
    const result: AssessmentResult = {
      countryCode: currentQuestion.country.code,
      isCorrect,
      responseTime
    };
    
    setResults([...results, result]);
    
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setQuestionStartTime(Date.now());
      } else {
        setStep('processing');
        processAssessmentMutation.mutate([...results, result]);
      }
    }, 1000);
  };

  const handleSkipAssessment = async () => {
    try {
      await apiRequest("POST", "/api/user/complete-onboarding", {});
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to skip assessment. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Brain className="h-12 w-12 text-blue-600 mr-3" />
              <Globe className="h-12 w-12 text-indigo-600" />
            </div>
            <CardTitle className="text-3xl">Welcome to WorldCap!</CardTitle>
            <CardDescription className="text-base mt-2">
              Let's personalize your learning journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">AI-Powered Personalization</h3>
                  <p className="text-sm text-gray-600">
                    We'll test your knowledge on 25 diverse countries to understand your baseline knowledge.
                    {user?.homeCountry && " Your home country selection helps us calibrate difficulty levels based on geographical familiarity."}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Dynamic Difficulty</h3>
                  <p className="text-sm text-gray-600">
                    Countries near your home region will start easier, while distant countries begin harder. 
                    As you practice, difficulty adjusts automatically based on your performance.
                  </p>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>This assessment takes about 5-7 minutes.</strong> Don't worry about getting every answer right - 
                  this helps us understand where you are so we can provide the best learning experience!
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => setStep('assessment')} 
                className="flex-1"
                data-testid="button-start-assessment"
              >
                Start Assessment
              </Button>
              <Button 
                onClick={handleSkipAssessment} 
                variant="outline"
                className="flex-1"
                data-testid="button-skip-assessment"
              >
                Skip for Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'assessment' && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardDescription>Question {currentQuestionIndex + 1} of {questions.length}</CardDescription>
              <CardDescription>{currentQuestion.country.continent}</CardDescription>
            </div>
            <Progress value={progress} className="mb-4" />
            <CardTitle className="text-2xl" data-testid="text-question">
              {currentQuestion.question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentQuestion.correctAnswer;
                const showResult = selectedAnswer !== null;
                
                let buttonVariant: "default" | "outline" | "destructive" = "outline";
                let buttonClass = "";
                
                if (showResult) {
                  if (isCorrect) {
                    buttonVariant = "default";
                    buttonClass = "bg-green-600 hover:bg-green-700 text-white";
                  } else if (isSelected && !isCorrect) {
                    buttonVariant = "destructive";
                  }
                }
                
                return (
                  <Button
                    key={index}
                    variant={buttonVariant}
                    className={`w-full text-left justify-start h-auto py-4 px-6 ${buttonClass}`}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={selectedAnswer !== null}
                    data-testid={`button-answer-${index}`}
                  >
                    <span className="text-base">{option}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            </div>
            <h3 className="text-xl font-semibold">Analyzing Your Results...</h3>
            <p className="text-gray-600">
              We're calibrating your personalized difficulty levels based on your performance
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'complete') {
    const correctCount = results.filter(r => r.isCorrect).length;
    const accuracy = Math.round((correctCount / results.length) * 100);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-3xl">Assessment Complete!</CardTitle>
            <CardDescription className="text-base mt-2">
              Your personalized learning journey is ready
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white rounded-lg p-6 space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2" data-testid="text-accuracy">
                  {accuracy}%
                </div>
                <p className="text-gray-600">Accuracy</p>
                <p className="text-sm text-gray-500 mt-1">
                  You got {correctCount} out of {results.length} questions correct
                </p>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">What's Next:</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Difficulty levels have been calibrated based on your performance and geographical background</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Countries you're familiar with will be easier, while new regions will be more challenging</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>The AI will continuously adapt as you learn, keeping you in your optimal learning zone</span>
                  </li>
                </ul>
              </div>
            </div>

            <Button 
              onClick={() => setLocation("/")} 
              className="w-full"
              size="lg"
              data-testid="button-start-learning"
            >
              Start Learning
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
