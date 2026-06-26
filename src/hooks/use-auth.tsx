import { useEffect, ReactNode } from "react";
import { setAuthTokenGetter, setUnauthorizedHandler, useAuthStore, useLogin, useRegister, useRefreshToken, useLogout, customFetch } from "@workspace/api-client-react";
import type { TokenResponse } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function AuthProvider({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const setLoading = useAuthStore((s) => s.setLoading);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const refreshMutation = useRefreshToken();

  useEffect(() => {
    setAuthTokenGetter(() => useAuthStore.getState().token);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      const storedRefresh = localStorage.getItem("refreshToken");
      if (!storedRefresh) {
        logout();
        return false;
      }
      try {
        const res = await customFetch<TokenResponse>("/api/v1/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: storedRefresh }),
        });
        setAuth(res.accessToken, res.refreshToken, useAuthStore.getState().user);
        sessionStorage.setItem("accessToken", data.accessToken);
        return true;
      } catch {
        const user = useAuthStore.getState().user;
        if (user) {
          // Only auto-logout on web when there's a logged-in user whose session expired
          logout();
          setLocation("/login");
        }
        return false;
      }
    });
  }, []);

  // Function to fetch current user profile
  const fetchUserProfile = async (accessToken: string) => {
    try {
      const profile = await customFetch<any>("/api/v1/users/profile", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setUser(profile);
      return profile;
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      return null;
    }
  };

  useEffect(() => {
    const storedRefresh = localStorage.getItem("refreshToken");
    if (storedRefresh) {
      refreshMutation.mutate(
        { data: { refreshToken: storedRefresh } },
        {
          onSuccess: async (data) => {
            setAuth(data.accessToken, data.refreshToken, null); // Set tokens first
        sessionStorage.setItem("accessToken", res.accessToken);
            // Now fetch the user profile
            await fetchUserProfile(data.accessToken);
            setLoading(false);
          },
          onError: () => {
            localStorage.removeItem("refreshToken");
            logout();
            setLoading(false);
          },
        }
      );
    } else {
      setLoading(false);
    }
  }, []);

  const loginMutation = useLogin();
  const login = async (data: any) => {
    try {
      const res = await loginMutation.mutateAsync({ data });
      setAuth(res.accessToken, res.refreshToken, res.user);
      sessionStorage.setItem("accessToken", res.accessToken);
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ title: "Login Failed", description: err.message, variant: "destructive" });
      throw err;
    }
  };

  const registerMutation = useRegister();
  const register = async (data: any) => {
    try {
      const res = await registerMutation.mutateAsync({ data });
      setAuth(res.accessToken, res.refreshToken, res.user);
      sessionStorage.setItem("accessToken", res.accessToken);
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ title: "Registration Failed", description: err.message, variant: "destructive" });
      throw err;
    }
  };

  const logoutMutation = useLogout();
  const handleLogout = () => {
    const storedRefresh = localStorage.getItem("refreshToken");
    if (storedRefresh) {
      logoutMutation.mutate({ data: { refreshToken: storedRefresh } });
    }
    sessionStorage.removeItem("accessToken");
    logout();
    setLocation("/login");
  };

  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout: handleLogout, isAuthenticated: !!token, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

import { createContext, useContext } from "react";

interface AuthContextType {
  token: string | null;
  user: any | null;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
