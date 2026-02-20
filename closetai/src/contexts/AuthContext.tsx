import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

type User = { id: string; email: string; plan?: "free" | "premium" | "enterprise" };

type AuthContext = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContext | null>(null);

const STORAGE_KEY = "closetai_token";
const USER_KEY = "closetai_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem(STORAGE_KEY);
    const u = localStorage.getItem(USER_KEY);
    if (t && u) {
      try {
        const parsed = JSON.parse(u);
        setUser({ ...parsed, plan: parsed.plan ?? "free" });
        setToken(t);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ user: User; token: string }>("/auth/login", { email, password }, false);
    localStorage.setItem(STORAGE_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setUser(res.user);
    setToken(res.token);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ user: User; token: string }>("/auth/register", { email, password }, false);
    localStorage.setItem(STORAGE_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setUser(res.user);
    setToken(res.token);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
