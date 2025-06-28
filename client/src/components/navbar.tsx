import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Star, User } from "lucide-react";

export function Navbar() {
  const [location] = useLocation();
  
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">WorldCap</h1>
          </Link>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Star className="w-5 h-5 text-accent fill-current" />
              <span>{user?.currentStreak || 0} day streak</span>
            </div>
            
            <Link href="/profile" className="flex items-center space-x-2 hover:bg-gray-50 px-3 py-2 rounded-md transition-colors">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {user?.username || "User"}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
