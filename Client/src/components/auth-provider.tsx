"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { api, apiConfigured } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import {
  clearSession,
  sessionToken,
  storeSession,
  SESSION_EXPIRED_EVENT,
} from "@/lib/session";
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
  sessionError: string;
  canReconnect: boolean;
  retrySession: () => Promise<void>;
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
  const [sessionError, setSessionError] = useState("");
  const [canReconnect, setCanReconnect] = useState(false);
  const generation = useRef(0);
  const queryClient = useQueryClient();
  const clearPrivateQueries = useCallback(() => {
    queryClient.removeQueries({
      predicate: (query) =>
        ["admin", "analytics"].includes(String(query.queryKey[0])),
    });
  }, [queryClient]);
  const logout = useCallback(() => {
    generation.current++;
    clearSession();
    clearPrivateQueries();
    setUser(null);
    setLoading(false);
    setSessionError("");
    setCanReconnect(false);
  }, [clearPrivateQueries]);
  const retrySession = useCallback(async () => {
    const token = sessionToken();
    if (!apiConfigured || !token) {
      setLoading(false);
      return;
    }
    const current = ++generation.current;
    setLoading(true);
    setSessionError("");
    setCanReconnect(false);
    try {
      const { data } = await api.get<User>("/auth/me");
      if (generation.current === current && sessionToken() === token)
        setUser(data);
    } catch {
      if (generation.current === current) {
        setSessionError(
          "We couldn't reconnect to your account. Your saved session is still here.",
        );
        setCanReconnect(true);
      }
    } finally {
      if (generation.current === current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const expired = () => {
      logout();
      setSessionError("Your session has expired. Sign in again to continue.");
    };
    const online = () => {
      if (sessionToken()) void retrySession();
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, expired);
    window.addEventListener("online", online);
    void retrySession();
    return () => {
      generation.current++;
      window.removeEventListener(SESSION_EXPIRED_EVENT, expired);
      window.removeEventListener("online", online);
    };
  }, [logout, retrySession]);
  function accept(session: Session) {
    generation.current++;
    storeSession(session.accessToken);
    clearPrivateQueries();
    setUser(session.user);
    setLoading(false);
    setSessionError("");
    setCanReconnect(false);
  }
  return (
    <Context.Provider
      value={{
        user,
        loading,
        accept,
        logout,
        sessionError,
        canReconnect,
        retrySession,
      }}
    >
      {children}
    </Context.Provider>
  );
}
