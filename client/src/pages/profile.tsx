import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings, User, Globe, Filter } from "lucide-react";
import { countries } from "@/data/countries";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

export default function Profile() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [excludedCountries, setExcludedCountries] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Get user data
  const { data: user, isLoading: userLoading } = useQuery<UserType>({
    queryKey: ["/api/user"],
  });

  // Initialize excluded countries from user data
  useEffect(() => {
    if (user?.excludedCountries) {
      setExcludedCountries(user.excludedCountries);
    }
  }, [user]);

  // Mutation to update excluded countries
  const updateExcludedMutation = useMutation({
    mutationFn: async (newExcludedCountries: string[]) => {
      return apiRequest("/api/user/excluded-countries", {
        method: "PATCH",
        body: JSON.stringify({ excludedCountries: newExcludedCountries }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your learning preferences have been updated.",
      });
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCountryToggle = (countryCode: string) => {
    const newExcluded = excludedCountries.includes(countryCode)
      ? excludedCountries.filter(code => code !== countryCode)
      : [...excludedCountries, countryCode];
    
    setExcludedCountries(newExcluded);
    setHasChanges(true);
  };

  const handleSave = () => {
    updateExcludedMutation.mutate(excludedCountries);
  };

  const handleSelectAll = () => {
    setExcludedCountries(countries.map(c => c.code));
    setHasChanges(true);
  };

  const handleSelectNone = () => {
    setExcludedCountries([]);
    setHasChanges(true);
  };

  // Filter countries by search term
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.capital.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group countries by difficulty
  const groupedCountries = {
    beginner: filteredCountries.filter(c => c.difficulty === "beginner"),
    intermediate: filteredCountries.filter(c => c.difficulty === "intermediate"),
    expert: filteredCountries.filter(c => c.difficulty === "expert"),
  };

  if (userLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Profile & Settings</h1>
            <p className="text-gray-600">Customize your learning experience</p>
          </div>
        </div>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Username</Label>
              <Input value={user?.username || ""} disabled />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>
          </CardContent>
        </Card>

        {/* Learning Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Learning Preferences
            </CardTitle>
            <CardDescription>
              Select countries you already know well to exclude them from practice sessions. 
              This helps focus your learning on areas where you need improvement.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Countries excluded from practice</p>
                  <p className="text-sm text-gray-600">
                    {excludedCountries.length} of {countries.length} countries excluded
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {excludedCountries.length}
              </Badge>
            </div>

            {/* Search and Controls */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Search countries or capitals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" onClick={handleSelectAll}>
                  Select All
                </Button>
                <Button variant="outline" onClick={handleSelectNone}>
                  Select None
                </Button>
              </div>
            </div>

            {/* Countries List */}
            <ScrollArea className="h-96 border rounded-lg">
              <div className="p-4 space-y-6">
                {Object.entries(groupedCountries).map(([difficulty, countryList]) => (
                  <div key={difficulty}>
                    <h3 className="font-semibold text-lg mb-3 capitalize flex items-center gap-2">
                      {difficulty} Level
                      <Badge variant="secondary">{countryList.length} countries</Badge>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {countryList.map((country) => (
                        <div
                          key={country.code}
                          className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50"
                        >
                          <Checkbox
                            id={country.code}
                            checked={excludedCountries.includes(country.code)}
                            onCheckedChange={() => handleCountryToggle(country.code)}
                          />
                          <Label
                            htmlFor={country.code}
                            className="flex-1 cursor-pointer text-sm"
                          >
                            <span className="font-medium">{country.name}</span>
                            <span className="text-gray-500 ml-2">→ {country.capital}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                    {difficulty !== "expert" && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Save Button */}
            <div className="flex justify-between items-center pt-4">
              <p className="text-sm text-gray-600">
                {hasChanges ? "You have unsaved changes" : "All changes saved"}
              </p>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || updateExcludedMutation.isPending}
              >
                {updateExcludedMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}