import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/navbar";
import Dashboard from "@/pages/dashboard";
import Quiz from "@/pages/quiz";
import DynamicQuiz from "@/pages/dynamic-quiz";
import Flashcards from "@/pages/flashcards";
import TypingPractice from "@/pages/typing-practice";
import MapChallenge from "@/pages/map-challenge";
import Profile from "@/pages/profile";
import AnalyticsDashboard from "@/pages/analytics-dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/quiz" component={Quiz} />
      <Route path="/dynamic-quiz" component={DynamicQuiz} />
      <Route path="/flashcards" component={Flashcards} />
      <Route path="/typing-practice" component={TypingPractice} />
      <Route path="/map-challenge" component={MapChallenge} />
      <Route path="/profile" component={Profile} />
      <Route path="/analytics-dashboard" component={AnalyticsDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
