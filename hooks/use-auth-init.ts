"use client";

import { useEffect } from "react";
import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/store/auth-store";

export function useAuthInit() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);
}
