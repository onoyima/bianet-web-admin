import { create } from "zustand";

interface User {
  id: string;
  phone: string;
  email?: string | null;
  role: string;
  language: string;
  isActive: boolean;
  kycStatus: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  businessName?: string | null;
  state?: string | null;
  country?: string | null;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (token: string, refreshToken: string, user: User | null) => void;
  setUser: (user: User) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setAuth: (token, refreshToken, user) => {
    localStorage.setItem("refreshToken", refreshToken);
    set({ token, refreshToken, user, isAuthenticated: true, isLoading: false });
  },
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token, isAuthenticated: !!token }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => {
    localStorage.removeItem("refreshToken");
    set({ token: null, refreshToken: null, user: null, isAuthenticated: false, isLoading: false });
  },
}));

interface UiState {
  sidebarOpen: boolean;
  theme: "light" | "dark" | "system";
  toggleSidebar: () => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  theme: "system",
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
}));
