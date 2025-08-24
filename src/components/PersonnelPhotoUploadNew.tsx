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
import { Camera, Upload, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabaseHelpers } from "@/integrations/supabase/client";

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
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl || null);
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

      // Update personnel record with new photo URL
      await supabaseHelpers.updatePersonnel(personnelId, {
        photo_url: uploadedFile.url,
      });

      setPhotoUrl(uploadedFile.url);
      onPhotoUpdate?.(uploadedFile.url);

      toast({
        title: "✅ Photo Updated",
        description: "Personnel photo has been updated successfully",
        duration: 3000,
      });

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
      // Delete photo from Google Cloud Storage if it exists
      if (photoUrl && photoUrl.includes('firebasestorage.googleapis.com')) {
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

      // Update personnel record to remove photo URL
      await supabaseHelpers.updatePersonnel(personnelId, {
        photo_url: null,
      });

      setPhotoUrl(null);
      onPhotoUpdate?.(null);

      toast({
        title: "✅ Photo Removed",
        description: "Personnel photo has been removed",
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
    <div className="flex items-center gap-3">
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={photoUrl || undefined} alt={getDisplayName()} />
        <AvatarFallback>{getInitials()}</AvatarFallback>
      </Avatar>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Camera className="w-4 h-4" />
            {photoUrl ? "Change Photo" : "Add Photo"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {photoUrl ? "Update Photo" : "Add Photo"} - {getDisplayName()}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Photo Preview */}
            {photoUrl && (
              <div className="flex flex-col items-center gap-3 p-4 border rounded-lg bg-gray-50">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={photoUrl} alt={getDisplayName()} />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                <p className="text-sm text-gray-600">Current Photo</p>
              </div>
            )}

            {/* Upload New Photo */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">
                {photoUrl ? "Upload New Photo" : "Upload Photo"}
              </h4>
              
              <FileUpload
                options={{
                  bucket: STORAGE_BUCKETS.PERSONNEL_PHOTOS,
                  folder: `personnel/${personnelId}`,
                  generateUniqueName: true,
                }}
                config={FILE_CONFIGS.IMAGES}
                onUploadComplete={handleUploadComplete}
                onError={handleUploadError}
                multiple={false}
                accept="image/*"
                placeholder="Choose photo or drag and drop"
                disabled={isUploading}
              />
            </div>

            {/* Remove Photo Option */}
            {photoUrl && (
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
