"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

// SSR compatibility check
const isClient = typeof window !== "undefined";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Return null during SSR to prevent hydration issues
  if (!isClient) {
    return null;
  }

  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Only redirect if we're done loading and there's no user
    if (!loading && !user && !redirecting) {
      console.log("No user found, redirecting to auth");
      setRedirecting(true);

      // Store the current path so we can redirect back after login
      if (pathname && pathname !== "/" && pathname !== "/auth") {
        sessionStorage.setItem("intendedPath", pathname);
      }

      router.replace("/");
    }
  }, [user, loading, router, pathname]);

  // Show loading while checking authentication
  if (loading) {
    return null; // No loading screen for SSR compatibility
  }

  // If not authenticated after loading, redirect immediately
  if (!user) {
    return null; // No loading screen for SSR compatibility
  }

  // User is authenticated, show the protected content
  return <>{children}</>;
}
