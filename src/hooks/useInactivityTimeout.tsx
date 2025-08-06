"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { sessionUtils } from "@/integrations/supabase/client";

interface UseInactivityTimeoutProps {
  timeoutMinutes?: number;
  warningMinutes?: number;
}

export function useInactivityTimeout({
  timeoutMinutes = 4,
  warningMinutes = 3,
}: UseInactivityTimeoutProps = {}) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
    warningShownRef.current = false;
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      console.log("Inactivity timeout - logging out user");

      // Clear any stale session data and cache
      sessionUtils.clearStaleSession();

      // Clear sessionStorage and cache to prevent persistence
      if (typeof window !== "undefined") {
        sessionStorage.clear();

        // Clear browser cache
        if ("caches" in window) {
          caches.keys().then((names) => {
            names.forEach((name) => {
              caches.delete(name);
            });
          });
        }
      }

      await signOut();

      toast({
        title: "🔒 Session Expired",
        description: "You have been logged out due to inactivity.",
        variant: "destructive",
        duration: 5000,
      });
    } catch (error) {
      console.error("Error during auto logout:", error);
      // Force clear session and cache even if signOut fails
      sessionUtils.clearStaleSession();
      if (typeof window !== "undefined") {
        sessionStorage.clear();
        localStorage.clear();
      }
      window.location.href = "/";
    }
  }, [signOut, toast]);

  const showWarning = useCallback(() => {
    if (!warningShownRef.current) {
      warningShownRef.current = true;
      toast({
        title: "⚠️ Session Warning",
        description: `Your session will expire in ${
          timeoutMinutes - warningMinutes
        } minute(s) due to inactivity.`,
        duration: 10000,
      });
    }
  }, [timeoutMinutes, warningMinutes, toast]);

  const resetTimer = useCallback(() => {
    if (!user) return;

    clearTimers();

    // Set warning timer
    warningRef.current = setTimeout(() => {
      showWarning();
    }, warningMinutes * 60 * 1000);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, timeoutMinutes * 60 * 1000);
  }, [
    user,
    timeoutMinutes,
    warningMinutes,
    clearTimers,
    showWarning,
    handleLogout,
  ]);

  useEffect(() => {
    if (!user) {
      clearTimers();
      return;
    }

    console.log("Starting inactivity timer for user:", user.email);

    // Activity events to monitor
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    // Reset timer on any activity
    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start initial timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearTimers();
    };
  }, [user, resetTimer, clearTimers]);

  return {
    resetTimer,
    clearTimers,
  };
}
