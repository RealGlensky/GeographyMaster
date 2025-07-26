import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/navbar";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Quiz from "@/pages/quiz";
import DynamicQuiz from "@/pages/dynamic-quiz";
import DifficultySelection from "@/pages/difficulty-selection";
import Flashcards from "@/pages/flashcards";
import TypingPractice from "@/pages/typing-practice";
import MapChallenge from "@/pages/map-challenge";
import Profile from "@/pages/profile";
import AnalyticsDashboard from "@/pages/analytics-dashboard";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/difficulty-selection" component={DifficultySelection} />
          <Route path="/quiz" component={Quiz} />
          <Route path="/dynamic-quiz" component={DynamicQuiz} />
          <Route path="/flashcards" component={Flashcards} />
          <Route path="/typing-practice" component={TypingPractice} />
          <Route path="/map-challenge" component={MapChallenge} />
          <Route path="/profile" component={Profile} />
          <Route path="/analytics-dashboard" component={AnalyticsDashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthenticatedApp />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AuthenticatedApp() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Router />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Router />
    </div>
  );
}

export default App;
