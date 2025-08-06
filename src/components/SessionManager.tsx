"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";

export function SessionManager() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only handle session recovery, not redirects
    if (!loading && typeof window !== "undefined") {
      // Store current path for session recovery (but don't redirect)
      if (pathname && pathname !== "/" && pathname !== "/auth") {
        sessionStorage.setItem("lastVisitedPath", pathname);
      }
    }
  }, [pathname, loading]);

  return null;
}
