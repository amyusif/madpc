"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleStart = () => {
      setLoading(true);
      // Auto-hide after 2 seconds in case navigation completes without detection
      timeout = setTimeout(() => setLoading(false), 2000);
    };

    const handleComplete = () => {
      clearTimeout(timeout);
      setLoading(false);
    };

    // Show loading when pathname changes
    handleStart();

    // Hide loading after a short delay to allow for smooth transition
    const completeTimeout = setTimeout(handleComplete, 500);

    return () => {
      clearTimeout(timeout);
      clearTimeout(completeTimeout);
    };
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-blue-200">
        <div className="h-full bg-blue-600 transition-all duration-300 ease-out w-full animate-pulse"></div>
      </div>
    </div>
  );
}
