"use client";

import { create } from "zustand";

interface ThemeState {
    theme: string;
    setTheme: (theme: string) => void;
    toggleTheme: () => void;
}

const useThemeStore = create<ThemeState>((set) => ({
    theme: 'light',
    setTheme: (theme) => set({ theme }),
    toggleTheme: () => set((state) => {
        return { theme: state.theme === 'light' ? 'dark' : 'light' };
    }),
}));

export default useThemeStore;
