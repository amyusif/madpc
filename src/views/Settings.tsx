import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserProfilePhotoUpload } from "@/components/UserProfilePhotoUpload";
import { Save, User, Shield, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { createStorageBuckets } from "@/utils/setupBuckets";
import {
  checkDatabaseHealth,
  setupRequiredTables,
} from "@/utils/setupDatabase";

export default function Settings() {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: "",
    badgeNumber: "",
    phone: "",
    role: "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Load profile data on component mount
  useEffect(() => {
    if (profile) {
      setProfileData({
        fullName: profile.full_name || "",
        badgeNumber: profile.badge_number || "",
        phone: profile.phone || "",
        role: profile.role || "",
      });
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // Update profile in Supabase
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileData.fullName,
          badge_number: profileData.badgeNumber,
          phone: profileData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "✅ Profile Updated",
        description: "Your profile has been updated successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update your profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpdate = (photoUrl: string | null) => {
    setAvatarUrl(photoUrl);
  };

  const handleSetupBuckets = async () => {
    setLoading(true);
    try {
      const results = await createStorageBuckets();
      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      if (failCount === 0) {
        toast({
          title: "✅ Storage Setup Complete",
          description: `Successfully set up ${successCount} storage buckets`,
          duration: 3000,
        });
      } else {
        toast({
          title: "⚠️ Partial Setup",
          description: `${successCount} buckets created, ${failCount} failed`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Setup Failed",
        description: "Failed to set up storage buckets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckDatabase = async () => {
    setLoading(true);
    try {
      const health = await checkDatabaseHealth();

      if (health.healthy) {
        toast({
          title: "✅ Database Healthy",
          description:
            "All required tables and storage are properly configured",
          duration: 3000,
        });
      } else {
        const issuesList = health.issues.join(", ");
        toast({
          title: "⚠️ Database Issues Found",
          description: `Issues: ${issuesList}`,
          variant: "destructive",
          duration: 5000,
        });

        // Show recommendations in console
        console.log("Database recommendations:", health.recommendations);
      }
    } catch (error) {
      toast({
        title: "Health Check Failed",
        description: "Failed to check database health",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetupDatabase = async () => {
    setLoading(true);
    try {
      const results = await setupRequiredTables();

      if (results.success) {
        toast({
          title: "✅ Database Setup Complete",
          description: "All required tables are now available",
          duration: 3000,
        });
      } else {
        const issues = results.results
          .filter((r) => r.error)
          .map((r) => `${r.table}: ${r.error}`)
          .join("; ");

        toast({
          title: "⚠️ Partial Database Setup",
          description: `Some issues remain: ${issues}`,
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: "Setup Failed",
        description: "Failed to set up database tables",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Profile Photo</Label>
              <UserProfilePhotoUpload
                currentPhotoUrl={avatarUrl ?? undefined}
                onPhotoUpdate={handlePhotoUpdate}
                size="xl"
                editable={true}
                showChangeButton={true}
              />
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSaveChanges} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    value={profileData.fullName}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        fullName: e.target.value,
                      })
                    }
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="badgeNumber"
                    className="flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Badge Number
                  </Label>
                  <Input
                    id="badgeNumber"
                    value={profileData.badgeNumber}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        badgeNumber: e.target.value,
                      })
                    }
                    placeholder="Enter badge number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-sm text-muted-foreground">
                    Email cannot be changed from this page
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        phone: e.target.value,
                      })
                    }
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Role
                </Label>
                <Input
                  id="role"
                  value={profileData.role}
                  disabled
                  className="bg-gray-50 capitalize"
                />
                <p className="text-sm text-muted-foreground">
                  Role is assigned by system administrator
                </p>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="gap-2">
                  <Save className="w-4 h-4" />
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Database & Storage Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              System Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Database Setup */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-medium">Database Tables</Label>
                <p className="text-sm text-muted-foreground">
                  Check and set up required database tables for the application.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCheckDatabase}
                  disabled={loading}
                  variant="outline"
                  className="gap-2"
                >
                  <Shield className="w-4 h-4" />
                  {loading ? "Checking..." : "Check Database Health"}
                </Button>
                <Button
                  onClick={handleSetupDatabase}
                  disabled={loading}
                  variant="outline"
                  className="gap-2"
                >
                  <Shield className="w-4 h-4" />
                  {loading ? "Setting up..." : "Setup Database"}
                </Button>
              </div>
            </div>

            {/* Storage Setup */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-medium">
                  File Storage Buckets
                </Label>
                <p className="text-sm text-muted-foreground">
                  Set up storage buckets for file uploads. This is required for
                  profile photos and file attachments.
                </p>
              </div>
              <div className="flex justify-start">
                <Button
                  onClick={handleSetupBuckets}
                  disabled={loading}
                  variant="outline"
                  className="gap-2"
                >
                  <Shield className="w-4 h-4" />
                  {loading ? "Setting up..." : "Setup Storage Buckets"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred theme
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                Use the theme toggle in the header
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Role</Label>
                <p className="text-sm text-muted-foreground">
                  Your current role in the system
                </p>
              </div>
              <div className="text-sm font-medium">Commander</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
