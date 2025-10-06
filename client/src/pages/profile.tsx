import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Settings, User, Globe, Filter, Edit, Eye, EyeOff, Save, X, Brain, RefreshCw } from "lucide-react";
import { countries } from "@/data/countries";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";
import { CountryFlag } from "@/components/country-flag";
import { PronunciationButton } from "@/components/pronunciation-button";

// Form schemas
const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/(?=.*[0-9])/, "Password must contain at least one number")
    .regex(/(?=.*[A-Z])/, "Password must contain at least one uppercase letter")
    .regex(/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?])/, "Password must contain at least one special character"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type UpdateProfileData = z.infer<typeof updateProfileSchema>;
type ChangePasswordData = z.infer<typeof changePasswordSchema>;

export default function Profile() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [excludedCountries, setExcludedCountries] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Get user data
  const { data: user, isLoading: userLoading } = useQuery<UserType>({
    queryKey: ["/api/user"],
  });

  // Profile form
  const profileForm = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  // Password form
  const passwordForm = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update profile form when user data loads
  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
      });
    }
  }, [user, profileForm]);

  // Initialize excluded countries from user data
  useEffect(() => {
    if (user?.excludedCountries) {
      setExcludedCountries(user.excludedCountries);
    }
  }, [user]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const response = await apiRequest("PATCH", "/api/user/profile", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved.",
      });
      setIsEditingProfile(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      const response = await apiRequest("PATCH", "/api/user/password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
      setIsChangingPassword(false);
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password.",
        variant: "destructive",
      });
    },
  });

  // Mutation to update excluded countries
  const updateExcludedMutation = useMutation({
    mutationFn: async (newExcludedCountries: string[]) => {
      const response = await fetch("/api/user/excluded-countries", {
        method: "PATCH",
        body: JSON.stringify({ excludedCountries: newExcludedCountries }),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to update excluded countries");
      return response.json();
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
    easy: filteredCountries.filter(c => c.difficulty === "easy"),
    intermediate: filteredCountries.filter(c => c.difficulty === "intermediate"),
    advanced: filteredCountries.filter(c => c.difficulty === "advanced"),
    expert: filteredCountries.filter(c => c.difficulty === "expert"),
  };

  // Select all countries in a specific difficulty level
  const handleSelectAllInLevel = (level: keyof typeof groupedCountries) => {
    const levelCountries = groupedCountries[level].map(c => c.code);
    const newExcluded = Array.from(new Set([...excludedCountries, ...levelCountries]));
    setExcludedCountries(newExcluded);
    setHasChanges(true);
  };

  // Deselect all countries in a specific difficulty level
  const handleDeselectAllInLevel = (level: keyof typeof groupedCountries) => {
    const levelCountries = groupedCountries[level].map(c => c.code);
    const newExcluded = excludedCountries.filter(code => !levelCountries.includes(code));
    setExcludedCountries(newExcluded);
    setHasChanges(true);
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

        {/* Account Summary */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user?.username || "User"}
                </h2>
                <p className="text-gray-600 text-lg">{user?.email}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>@{user?.username}</span>
                  {user?.createdAt && (
                    <span>• Member since {new Date(user.createdAt).getFullYear()}</span>
                  )}
                  {user?.id === "demo-user-1" && (
                    <Badge variant="outline" className="text-blue-600 border-blue-600">Demo Account</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Edit Account Information
              </div>
              {!isEditingProfile && user?.id !== "demo-user-1" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingProfile(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </CardTitle>
            {user?.id === "demo-user-1" && (
              <CardDescription>
                This is a demo account with sample data. Create your own account to edit profile information and track your personal progress.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditingProfile ? (
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-3">
                    <Button 
                      type="submit" 
                      disabled={updateProfileMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditingProfile(false);
                        profileForm.reset();
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Username</Label>
                  <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md border">
                    {user?.username || "Not set"}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">First Name</Label>
                    <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md border">
                      {user?.firstName || "Not set"}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Last Name</Label>
                    <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md border">
                      {user?.lastName || "Not set"}
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Email Address</Label>
                  <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md border">
                    {user?.email || "Not set"}
                  </div>
                </div>
                {user?.createdAt && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Member Since</Label>
                    <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md border">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Password Change Section */}
        {user?.id !== "demo-user-1" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Security
                </div>
                {!isChangingPassword && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsChangingPassword(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure. Your password was last updated on{" "}
                {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric'
                }) : "unknown date"}.
              </CardDescription>
            </CardHeader>
            {isChangingPassword && (
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit((data) => changePasswordMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                {...field} 
                                type={showCurrentPassword ? "text" : "password"}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              >
                                {showCurrentPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                {...field} 
                                type={showNewPassword ? "text" : "password"}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                              >
                                {showNewPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                {...field} 
                                type={showConfirmPassword ? "text" : "password"}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-3">
                      <Button 
                        type="submit" 
                        disabled={changePasswordMutation.isPending}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsChangingPassword(false);
                          passwordForm.reset();
                          setShowCurrentPassword(false);
                          setShowNewPassword(false);
                          setShowConfirmPassword(false);
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            )}
          </Card>
        )}

        {/* Home Country & Assessment Settings */}
        {user?.id !== "demo-user-1" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Personalization Settings
              </CardTitle>
              <CardDescription>
                Update your home country or retake the initial assessment to recalibrate your difficulty levels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Home Country</Label>
                  <Select
                    value={user?.homeCountry || ""}
                    onValueChange={async (value) => {
                      try {
                        await apiRequest("POST", "/api/user/set-home-country", { homeCountry: value });
                        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
                        toast({
                          title: "Home country updated",
                          description: "Your difficulty levels will be adjusted based on your new location.",
                        });
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to update home country",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="w-full" data-testid="select-profile-home-country">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-2">
                    {user?.homeCountry 
                      ? `Current: ${countries.find(c => c.code === user.homeCountry)?.name || "Not set"}`
                      : "Setting your home country helps personalize difficulty levels"}
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-1">Initial Assessment</h4>
                    <p className="text-sm text-gray-600">
                      {user?.onboardingCompleted 
                        ? "You've completed the initial assessment. Retake it to recalibrate your difficulty levels."
                        : "Complete the initial assessment to personalize your learning experience."}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        await apiRequest("PATCH", "/api/user/profile", { onboardingCompleted: false });
                        await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
                        setLocation("/onboarding");
                      } catch (error) {
                        window.location.href = "/onboarding";
                      }
                    }}
                    data-testid="button-retake-assessment"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {user?.onboardingCompleted ? "Retake Assessment" : "Take Assessment"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                {Object.entries(groupedCountries).map(([difficulty, countryList]) => {
                  const levelKey = difficulty as keyof typeof groupedCountries;
                  const selectedInLevel = countryList.filter(c => excludedCountries.includes(c.code)).length;
                  const allSelected = selectedInLevel === countryList.length;
                  
                  return (
                  <div key={difficulty}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg capitalize flex items-center gap-2">
                        {difficulty} Level
                        <Badge variant="secondary">{countryList.length} countries</Badge>
                        {selectedInLevel > 0 && (
                          <Badge variant="outline">{selectedInLevel} excluded</Badge>
                        )}
                      </h3>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => allSelected ? handleDeselectAllInLevel(levelKey) : handleSelectAllInLevel(levelKey)}
                          disabled={countryList.length === 0}
                        >
                          {allSelected ? "Deselect All" : "Select All"}
                        </Button>
                      </div>
                    </div>
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
                          <CountryFlag 
                            countryCode={country.code} 
                            countryName={country.name} 
                            size="sm"
                          />
                          <Label
                            htmlFor={country.code}
                            className="flex-1 cursor-pointer text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{country.name}</span>
                              <PronunciationButton 
                                text={country.name}
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0"
                              />
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-gray-500">→ {country.capital}</span>
                              <PronunciationButton 
                                text={country.capital}
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0"
                              />
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                    {difficulty !== "expert" && <Separator className="mt-4" />}
                  </div>
                  );
                })}
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