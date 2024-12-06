"use client";

import { User } from "firebase/auth";
import { create } from "zustand";
import { auth } from "@/lib/firebase";
import { loginWithGoogle, logout } from "@/lib/auth";

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,
  login: async () => {
    try {
      set({ loading: true });
      await loginWithGoogle();
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  logout: async () => {
    try {
      set({ loading: true });
      await logout();
      set({ user: null });
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  setUser: (user) => set({ user, initialized: true }),
  setLoading: (loading) => set({ loading }),
}));
