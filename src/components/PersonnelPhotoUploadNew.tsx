"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UploadThingUpload } from "@/components/ui/uploadthing-upload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Camera, Upload, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabaseHelpers } from "@/integrations/supabase/client";
import { STORAGE_ENDPOINTS, FILE_CONFIGS } from "@/utils/fileStorageNew";

interface PersonnelPhotoUploadProps {
  personnelId: string;
  currentPhotoUrl?: string | null;
  firstName: string;
  lastName: string;
  onPhotoUpdate?: (photoUrl: string | null) => void;
  size?: "sm" | "md" | "lg" | "xl";
  editable?: boolean;
}

export function PersonnelPhotoUploadNew({
  personnelId,
  currentPhotoUrl,
  firstName,
  lastName,
  onPhotoUpdate,
  size = "md",
  editable = true,
}: PersonnelPhotoUploadProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  };

  const getInitials = () => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getDisplayName = () => {
    return `${firstName} ${lastName}`;
  };

  const handleUploadComplete = async (files: { url: string; name: string; size: number }[]) => {
    if (files.length === 0) return;

    const uploadedFile = files[0];
    setIsUploading(true);

    try {
      // Update personnel record with new photo URL
      await supabaseHelpers.updatePersonnel(personnelId, {
        photo_url: uploadedFile.url,
      });

      toast({
        title: "✅ Photo Updated",
        description: "Personnel photo has been updated successfully",
        duration: 3000,
      });

      onPhotoUpdate?.(uploadedFile.url);
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Photo update error:", error);
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update personnel photo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadError = (error: string) => {
    toast({
      title: "Upload Failed",
      description: error,
      variant: "destructive",
    });
  };

  const handleRemovePhoto = async () => {
    setIsUploading(true);
    try {
      // Update personnel record to remove photo URL
      await supabaseHelpers.updatePersonnel(personnelId, {
        photo_url: null,
      });

      toast({
        title: "✅ Photo Removed",
        description: "Personnel photo has been removed",
        duration: 3000,
      });

      onPhotoUpdate?.(null);
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
        <AvatarImage src={currentPhotoUrl || undefined} alt={getDisplayName()} />
        <AvatarFallback>{getInitials()}</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={currentPhotoUrl || undefined} alt={getDisplayName()} />
        <AvatarFallback>{getInitials()}</AvatarFallback>
      </Avatar>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Camera className="w-4 h-4" />
            {currentPhotoUrl ? "Change Photo" : "Add Photo"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentPhotoUrl ? "Update Photo" : "Add Photo"} - {getDisplayName()}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Photo Preview */}
            {currentPhotoUrl && (
              <div className="flex flex-col items-center gap-3 p-4 border rounded-lg bg-gray-50">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={currentPhotoUrl} alt={getDisplayName()} />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                <p className="text-sm text-gray-600">Current Photo</p>
              </div>
            )}

            {/* Upload New Photo */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">
                {currentPhotoUrl ? "Upload New Photo" : "Upload Photo"}
              </h4>
              
              <UploadThingUpload
                endpoint={STORAGE_ENDPOINTS.PERSONNEL_PHOTOS}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                maxFiles={1}
                accept="image/*"
                placeholder="Choose photo or drag and drop"
                disabled={isUploading}
              />
            </div>

            {/* Remove Photo Option */}
            {currentPhotoUrl && (
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleRemovePhoto}
                  disabled={isUploading}
                  className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Photo
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
