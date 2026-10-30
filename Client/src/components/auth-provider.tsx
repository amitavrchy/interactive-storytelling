"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, apiConfigured } from "@/lib/api";
type User = {
  id: string;
  name: string;
  email: string;
  role: "READER" | "ADMIN";
};
type Session = { user: User; accessToken: string };
type Auth = {
  user: User | null;
  loading: boolean;
  accept: (session: Session) => void;
  logout: () => void;
};
const Context = createContext<Auth | null>(null);
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("AuthProvider is required");
  return value;
}
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem("lighthouse-token");
    } catch {
      /* Site storage may be disabled. */
    }
    setUser(null);
  }, []);
  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        if (apiConfigured && sessionStorage.getItem("lighthouse-token")) {
          const { data } = await api.get<User>("/auth/me");
          if (active) setUser(data);
        }
      } catch {
        if (active) logout();
      } finally {
        if (active) setLoading(false);
      }
    }
    void restore();
    return () => {
      active = false;
    };
  }, [logout]);
  function accept(session: Session) {
    try {
      sessionStorage.setItem("lighthouse-token", session.accessToken);
    } catch {
      throw new Error("Allow site storage in your browser to stay signed in.");
    }
    setUser(session.user);
  }
  return (
    <Context.Provider value={{ user, loading, accept, logout }}>
      {children}
    </Context.Provider>
  );
}
