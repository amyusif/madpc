"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";

export function SessionManager() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined' && pathname && pathname !== '/') {
      sessionStorage.setItem('lastVisitedPath', pathname);
    }
  }, [pathname]);

  useEffect(() => {
    if (!loading && typeof window !== 'undefined') {
      const lastPath = sessionStorage.getItem('lastVisitedPath');

      if (user && lastPath && pathname === '/' && lastPath !== '/') {
        console.log('Recovering session, redirecting to:', lastPath);
        router.replace(lastPath);
        sessionStorage.removeItem('lastVisitedPath');
      } else if (!user && pathname && pathname !== '/' && pathname !== '/auth') {
        sessionStorage.setItem('intendedPath', pathname);
        router.replace('/');
      }
    }
  }, [user, loading, pathname, router]);

  return null;
}
