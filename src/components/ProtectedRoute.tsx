"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { PageLoading } from "@/components/ui/loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
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
    return <PageLoading text="Checking authentication..." />;
  }

  // If not authenticated after loading, show loading while redirecting
  if (!user) {
    return <PageLoading text="Redirecting to login..." />;
  }

  // User is authenticated, show the protected content
  return <>{children}</>;
}
