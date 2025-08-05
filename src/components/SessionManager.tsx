"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";

export function SessionManager() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Store the current path in sessionStorage for recovery
    if (typeof window !== 'undefined' && pathname !== '/') {
      sessionStorage.setItem('lastVisitedPath', pathname);
    }
  }, [pathname]);

  useEffect(() => {
    // Handle session recovery on app load
    if (!loading && typeof window !== 'undefined') {
      const lastPath = sessionStorage.getItem('lastVisitedPath');
      
      if (user && lastPath && pathname === '/' && lastPath !== '/') {
        // User is authenticated and we have a last visited path
        console.log('Recovering session, redirecting to:', lastPath);
        router.replace(lastPath);
        sessionStorage.removeItem('lastVisitedPath');
      } else if (!user && pathname !== '/' && pathname !== '/auth') {
        // User is not authenticated but trying to access protected route
        sessionStorage.setItem('intendedPath', pathname);
        router.replace('/');
      }
    }
  }, [user, loading, pathname, router]);

  // This component doesn't render anything
  return null;
}
