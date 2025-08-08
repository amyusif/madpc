"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigation } from "@/hooks/useNavigation";
import { PageLoading, ButtonLoading } from "@/components/ui/loading";
import { sessionUtils } from "@/integrations/supabase/client";

// SSR compatibility check
const isClient = typeof window !== "undefined";

export default function Auth() {
  // Return null during SSR to prevent hydration issues
  if (!isClient) {
    return null;
  }

  const router = useRouter();
  const { signIn, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { navigateTo, isNavigating } = useNavigation();

  // Redirect to dashboard when user is authenticated
  useEffect(() => {
    if (user && !authLoading) {
      // Add a small delay to ensure auth state is stable
      const timer = setTimeout(() => {
        // Get the intended destination from sessionStorage or default to dashboard
        const intendedPath =
          sessionStorage.getItem("intendedPath") || "/dashboard";
        sessionStorage.removeItem("intendedPath"); // Clean up

        console.log("Auth successful, redirecting to:", intendedPath);
        navigateTo(intendedPath, {
          replace: true,
          showToast: false, // Disable toast to reduce noise
          loadingText: "Redirecting...",
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [user, authLoading, navigateTo]);

  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Clear any stale session data before login
      sessionUtils.clearStaleSession();

      await signIn(loginData.email, loginData.password);

      toast({
        title: "✅ Welcome back!",
        description: "You have been logged in successfully.",
        duration: 3000,
      });

      // Don't manually redirect - let the useEffect handle it
    } catch (error: any) {
      console.error("Login error:", error);

      toast({
        title: "❌ Login Failed",
        description: error.message || "Please check your email and password.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading screen when authenticating or when user is found
  if (authLoading || (user && !authLoading)) {
    return (
      <PageLoading
        text={
          user ? "Redirecting to dashboard..." : "Checking authentication..."
        }
      />
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-3 sm:p-4 lg:p-6">
      <div className="w-full max-w-sm sm:max-w-md space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="flex justify-center">
            <Image
              src="/police logo.png"
              alt="Ghana Police Logo"
              width={64}
              height={64}
              className="object-contain sm:w-20 sm:h-20"
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
              Manso Adubia District Police Command
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Sign in to access the command center
            </p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg border-0 sm:border">
          <CardHeader className="text-center pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl font-bold">
              Sign In
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10 h-11 sm:h-12 text-base"
                    value={loginData.email}
                    onChange={(e) =>
                      setLoginData({ ...loginData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10 h-11 sm:h-12 text-base"
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({ ...loginData, password: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 h-11 sm:h-12 text-base font-medium"
                disabled={loading || isNavigating}
              >
                {loading || isNavigating ? (
                  <ButtonLoading text="Signing in..." />
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="text-center mt-4 sm:mt-6 text-xs sm:text-sm text-gray-600">
              For demo access, contact your administrator
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          © 2025 Manso Adubia District Police Command. All rights reserved.
        </div>
      </div>
    </div>
  );
}
