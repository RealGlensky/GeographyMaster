import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Target, Plus, Edit, Trash2, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface StudyGoal {
  id: number;
  userId: number;
  period: string;
  targetMinutes: number;
  isActive: boolean;
  createdAt: string;
}

interface GoalFormData {
  period: string;
  targetMinutes: number;
}

export function GoalsManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<StudyGoal | null>(null);
  const [formData, setFormData] = useState<GoalFormData>({
    period: 'daily',
    targetMinutes: 30,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["/api/user/study-goals"],
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const { data: dailyStats } = useQuery({
    queryKey: ["/api/user/daily-stats"],
  });

  const createGoalMutation = useMutation({
    mutationFn: (goalData: GoalFormData) => 
      apiRequest("/api/user/study-goals", "POST", goalData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/study-goals"] });
      setIsDialogOpen(false);
      setEditingGoal(null);
      resetForm();
      toast({
        title: "Goal created",
        description: "Your study goal has been set successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create study goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ goalId, ...data }: { goalId: number } & Partial<StudyGoal>) =>
      apiRequest(`/api/user/study-goals/${goalId}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/study-goals"] });
      setIsDialogOpen(false);
      setEditingGoal(null);
      resetForm();
      toast({
        title: "Goal updated",
        description: "Your study goal has been updated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update study goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (goalId: number) =>
      apiRequest(`/api/user/study-goals/${goalId}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/study-goals"] });
      toast({
        title: "Goal deleted",
        description: "Your study goal has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete study goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      period: 'daily',
      targetMinutes: 30,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGoal) {
      updateGoalMutation.mutate({
        goalId: editingGoal.id,
        targetMinutes: formData.targetMinutes,
      });
    } else {
      createGoalMutation.mutate(formData);
    }
  };

  const handleEdit = (goal: StudyGoal) => {
    setEditingGoal(goal);
    setFormData({
      period: goal.period,
      targetMinutes: goal.targetMinutes,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (goalId: number) => {
    if (confirm("Are you sure you want to delete this goal?")) {
      deleteGoalMutation.mutate(goalId);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      default: return period;
    }
  };

  const getGoalProgress = (goal: StudyGoal) => {
    if (goal.period === 'daily') {
      const todayTime = dailyStats?.studyTime || 0;
      return Math.min((todayTime / goal.targetMinutes) * 100, 100);
    } else if (goal.period === 'weekly') {
      // For weekly goals, we'd need to calculate the current week's total
      // For now, using today's time multiplied by 7 as approximation
      const todayTime = dailyStats?.studyTime || 0;
      const weeklyEstimate = todayTime * 7;
      return Math.min((weeklyEstimate / goal.targetMinutes) * 100, 100);
    } else if (goal.period === 'monthly') {
      // For monthly goals, we'd need to calculate the current month's total
      // For now, using today's time multiplied by 30 as approximation
      const todayTime = dailyStats?.studyTime || 0;
      const monthlyEstimate = todayTime * 30;
      return Math.min((monthlyEstimate / goal.targetMinutes) * 100, 100);
    }
    return 0;
  };

  const activeGoals = goals.filter((goal: StudyGoal) => goal.isActive);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600" />
            Study Goals
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => {
                setEditingGoal(null);
                resetForm();
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Set Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingGoal ? 'Edit Study Goal' : 'Set New Study Goal'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="period">Time Period</Label>
                  <Select 
                    value={formData.period} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, period: value }))}
                    disabled={!!editingGoal}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="targetMinutes">Target Time (minutes)</Label>
                  <Input
                    id="targetMinutes"
                    type="number"
                    min="1"
                    max="480"
                    value={formData.targetMinutes}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      targetMinutes: parseInt(e.target.value) || 0 
                    }))}
                    placeholder="e.g., 30"
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    {formatTime(formData.targetMinutes)} per {formData.period.slice(0, -2)}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createGoalMutation.isPending || updateGoalMutation.isPending}
                  >
                    {editingGoal ? 'Update Goal' : 'Create Goal'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : activeGoals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <div className="text-lg font-medium mb-2">No active goals</div>
            <div className="text-sm">
              Set study goals to track your progress and stay motivated!
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {activeGoals.map((goal: StudyGoal) => {
              const progress = getGoalProgress(goal);
              const isCompleted = progress >= 100;
              
              return (
                <div key={goal.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{getPeriodLabel(goal.period)} Goal</span>
                      </div>
                      <Badge variant={isCompleted ? "default" : "outline"}>
                        {formatTime(goal.targetMinutes)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(goal)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(goal.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className={`font-medium ${isCompleted ? 'text-green-600' : 'text-gray-700'}`}>
                        {progress}% Complete
                      </span>
                    </div>
                    <Progress 
                      value={progress} 
                      className={`h-2 ${isCompleted ? 'bg-green-100' : ''}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}