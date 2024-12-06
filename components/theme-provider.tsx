"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
import useThemeStore from '@/store/theme-store';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const { theme } = useThemeStore();
  console.log('Current theme in ThemeProvider:', theme);

  return <NextThemesProvider {...props} defaultTheme={theme}>{children}</NextThemesProvider>;
}