import axios from "axios";
import { chapters, lore, type Chapter, type LoreEntry } from "./story-content";
import { useQuery } from "@tanstack/react-query";

export const apiConfigured = !!process.env.NEXT_PUBLIC_API_URL;
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
});
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    let token: string | null = null;
    try {
      token = sessionStorage.getItem("lighthouse-token");
    } catch {
      /* Anonymous reading works with storage disabled. */
    }
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
export function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    return Array.isArray(message)
      ? message.join(". ")
      : typeof message === "string"
        ? message
        : "The harbour is out of reach. Check your connection and try again.";
  }
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
export function useChapters() {
  return useQuery({
    queryKey: ["chapters"],
    queryFn: async () => (await api.get<Chapter[]>("/chapters")).data,
    enabled: apiConfigured,
    placeholderData: chapters,
    retry: 1,
    staleTime: 60000,
  });
}
export function useLore() {
  return useQuery({
    queryKey: ["lore"],
    queryFn: async () => (await api.get<LoreEntry[]>("/lore")).data,
    enabled: apiConfigured,
    placeholderData: lore,
    retry: 1,
    staleTime: 60000,
  });
}
