"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useLoading } from "@/contexts/LoadingContext";

export function useNavigation() {
  const router = useRouter();
  const { toast } = useToast();
  const { isLoading, setLoading, setLoadingText } = useLoading();

  const navigateTo = useCallback(
    (
      path: string,
      options?: { replace?: boolean; showToast?: boolean; loadingText?: string }
    ) => {
      try {
        console.log("Navigating to:", path);

        if (options?.showToast) {
          toast({
            title: "🔄 Navigating...",
            description: "Please wait while we load the page",
            duration: 1000,
          });
        }

        // Navigate immediately without loading state conflicts
        if (options?.replace) {
          router.replace(path);
        } else {
          router.push(path);
        }
      } catch (error) {
        console.error("Navigation error:", error);

        toast({
          title: "❌ Navigation Failed",
          description: "Failed to navigate to the requested page",
          variant: "destructive",
        });
      }
    },
    [router, toast]
  );

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return {
    navigateTo,
    goBack,
    refresh,
    isNavigating: false, // Simplified to prevent conflicts
  };
}
