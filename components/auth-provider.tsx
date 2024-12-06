"use client";

import { useAuthInit } from "@/hooks/use-auth-init";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuthInit();
  return <>{children}</>;
}