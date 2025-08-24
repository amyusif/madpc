"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileUpload } from "@/components/ui/file-upload";
import { FILE_CONFIGS, STORAGE_BUCKETS, type FileUploadResult } from "@/utils/fileStorage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Camera, Upload, Trash2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface UserProfilePhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoUpdate?: (photoUrl: string | null) => void;
  size?: "sm" | "md" | "lg" | "xl";
  editable?: boolean;
  showChangeButton?: boolean;
}

export function UserProfilePhotoUpload({
  currentPhotoUrl,
  onPhotoUpdate,
  size = "lg",
  editable = true,
  showChangeButton = true,
}: UserProfilePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl || null);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-20 h-20",
    xl: "w-32 h-32",
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const getDisplayName = () => {
    return profile?.full_name || user?.email || "User";
  };

  const handleUploadComplete = async (result: FileUploadResult) => {
    if (!result.success || !result.url) return;

    const uploadedFile = { url: result.url } as const;

    setIsUploading(true);

    try {
      // Delete old photo if it exists
      if (photoUrl && photoUrl.includes('firebasestorage.googleapis.com')) {
        try {
          // Extract file path from Firebase Storage URL
          const urlParts = photoUrl.split('/o/')[1];
          const oldPath = decodeURIComponent(urlParts.split('?')[0]);
          await fetch('/api/upload/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath: oldPath }),
          });
        } catch (error) {
          console.warn('Failed to delete old photo:', error);
        }
      }

      // Update user profile with new photo URL
      const { error } = await supabase
        .from("profiles")
        .update({
          avatar_url: uploadedFile.url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user?.id);

      if (error) {
        throw error;
      }

      toast({
        title: "✅ Photo Updated",
        description: "Your profile photo has been updated successfully",
        duration: 3000,
      });

      setPhotoUrl(uploadedFile.url);
      onPhotoUpdate?.(uploadedFile.url);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update your profile photo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!photoUrl || !user?.id) return;

    setIsUploading(true);

    try {
      // Delete photo from Google Cloud Storage if it exists
      if (photoUrl.includes('firebasestorage.googleapis.com')) {
        try {
          // Extract file path from Firebase Storage URL
          const urlParts = photoUrl.split('/o/')[1];
          const filePath = decodeURIComponent(urlParts.split('?')[0]);
          await fetch('/api/upload/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath }),
          });
        } catch (error) {
          console.warn('Failed to delete photo from storage:', error);
        }
      }

      // Update user profile
      const { error } = await supabase
        .from("profiles")
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      setPhotoUrl(null);
      onPhotoUpdate?.(null);

      toast({
        title: "✅ Photo Removed",
        description: "Your profile photo has been removed successfully",
        duration: 3000,
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Photo removal error:", error);
      toast({
        title: "Remove Failed",
        description: "Failed to remove photo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };



  if (!editable) {
    return (
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={photoUrl || undefined} alt={getDisplayName()} />
        <AvatarFallback>{getInitials()}</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="relative group">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={photoUrl ?? undefined} alt={getDisplayName()} />
          <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
        </Avatar>
        {showChangeButton && (
          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
            <Camera className="w-6 h-6 text-white" />
          </div>
        )}
      </div>

      {showChangeButton && (
        <div className="space-y-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Camera className="w-4 h-4" />
                Change Photo
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Update Profile Photo</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Current Photo */}
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={photoUrl ?? undefined} alt={getDisplayName()} />
                    <AvatarFallback className="text-lg">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <p className="font-medium">{getDisplayName()}</p>
                    <p className="text-sm text-gray-500">
                      {profile?.role || "User"}
                    </p>
                  </div>
                </div>

                {/* File Upload */}
                <FileUpload
                  options={{
                    bucket: STORAGE_BUCKETS.USER_PROFILES,
                    folder: `users/${user?.id}`,
                    generateUniqueName: true,
                  }}
                  config={FILE_CONFIGS.IMAGES}
                  onUploadComplete={handleUploadComplete}
                  onError={(error) => {
                    toast({
                      title: "Upload Error",
                      description: error,
                      variant: "destructive",
                    });
                  }}
                  placeholder="Upload a new profile photo"
                  accept="image/*"
                  disabled={isUploading}
                  multiple={false}
                />

                {/* Actions */}
                <div className="flex gap-2">
                  {photoUrl && (
                    <Button
                      variant="outline"
                      onClick={handleRemovePhoto}
                      disabled={isUploading}
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove Photo
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <p className="text-sm text-muted-foreground">
            JPG, PNG or WebP. Max size 5MB.
          </p>
        </div>
      )}
    </div>
  );
}
