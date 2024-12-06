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
        console.log('Toggling theme:', state.theme);
        return { theme: state.theme === 'light' ? 'dark' : 'light' };
    }),
}));

export default useThemeStore;
