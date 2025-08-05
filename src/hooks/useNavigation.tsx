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
        setLoadingText(options?.loadingText || "Navigating...");
        setLoading(true);

        if (options?.showToast) {
          toast({
            title: "🔄 Navigating...",
            description: "Please wait while we load the page",
            duration: 2000,
          });
        }

        // Navigate immediately
        if (options?.replace) {
          router.replace(path);
        } else {
          router.push(path);
        }

        // Keep loading state for a bit to show feedback
        setTimeout(() => setLoading(false), 800);
      } catch (error) {
        console.error("Navigation error:", error);
        setLoading(false);

        toast({
          title: "❌ Navigation Failed",
          description: "Failed to navigate to the requested page",
          variant: "destructive",
        });
      }
    },
    [router, toast, setLoading, setLoadingText]
  );

  const goBack = useCallback(() => {
    setLoading(true);
    setLoadingText("Going back...");
    router.back();
    setTimeout(() => setLoading(false), 500);
  }, [router, setLoading, setLoadingText]);

  const refresh = useCallback(() => {
    setLoading(true);
    setLoadingText("Refreshing...");
    router.refresh();
    setTimeout(() => setLoading(false), 500);
  }, [router, setLoading, setLoadingText]);

  return {
    navigateTo,
    goBack,
    refresh,
    isNavigating: isLoading,
  };
}
