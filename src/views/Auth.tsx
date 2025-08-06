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

export default function Auth() {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Image
              src="/police logo.png"
              alt="Ghana Police Logo"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Manso Adubia District Police Command
            </h1>
            <p className="text-gray-600 mt-2">
              Sign in to access the command center
            </p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    value={loginData.email}
                    onChange={(e) =>
                      setLoginData({ ...loginData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10"
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
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading || isNavigating}
              >
                {loading || isNavigating ? (
                  <ButtonLoading text="Signing in..." />
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="text-center mt-4 text-sm text-gray-600">
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
