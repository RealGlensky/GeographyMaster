import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    // Treat 401 as success (user not authenticated)
    queryFn: async () => {
      const response = await fetch("/api/auth/user");
      if (response.status === 401) {
        return null; // User not authenticated
      }
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}