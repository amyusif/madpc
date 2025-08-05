import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Save } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: 'System',
    lastName: 'Administrator',
    email: 'admin@police.gov.gh',
    profileImageUrl: 'https://example.com/image.jpg'
  });

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
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
        <p className="text-muted-foreground">Manage your profile and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-lg">SA</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Camera className="w-4 h-4" />
                    Change Photo
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  JPG, PNG or GIF. Max size 2MB.
                </p>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSaveChanges} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="profileImageUrl">Profile Image URL (Optional)</Label>
                <Input
                  id="profileImageUrl"
                  value={profileData.profileImageUrl}
                  onChange={(e) => setProfileData({ ...profileData, profileImageUrl: e.target.value })}
                />
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

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Theme</Label>
                <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
              </div>
              <div className="text-sm text-muted-foreground">
                Use the theme toggle in the header
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Role</Label>
                <p className="text-sm text-muted-foreground">Your current role in the system</p>
              </div>
              <div className="text-sm font-medium">
                Commander
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 