"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileUpload } from "@/components/ui/file-upload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Camera, Upload, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  STORAGE_BUCKETS,
  FILE_CONFIGS,
  deleteFile,
  type FileUploadResult,
} from "@/utils/fileStorage";
import { supabaseHelpers } from "@/integrations/supabase/client";

interface PersonnelPhotoUploadProps {
  personnelId: string;
  currentPhotoUrl?: string;
  badgeNumber: string;
  fullName: string;
  onPhotoUpdate?: (photoUrl: string | null) => void;
  size?: "sm" | "md" | "lg";
  editable?: boolean;
}

export function PersonnelPhotoUpload({
  personnelId,
  currentPhotoUrl,
  badgeNumber,
  fullName,
  onPhotoUpdate,
  size = "md",
  editable = true,
}: PersonnelPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-20 h-20",
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleUploadComplete = async (result: FileUploadResult) => {
    if (!result.success || !result.url) {
      toast({
        title: "Upload Failed",
        description: result.error || "Failed to upload photo",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Update personnel record with new photo URL
      await supabaseHelpers.updatePersonnel(personnelId, {
        photo_url: result.url,
      });

      toast({
        title: "✅ Photo Updated",
        description: "Personnel photo has been updated successfully",
        duration: 3000,
      });

      onPhotoUpdate?.(result.url);
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update personnel record",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentPhotoUrl) return;

    setIsUploading(true);

    try {
      // Extract file path from URL
      const url = new URL(currentPhotoUrl);
      const pathParts = url.pathname.split("/");
      const filePath = pathParts.slice(-2).join("/"); // Get folder/filename

      // Delete from storage
      await deleteFile(STORAGE_BUCKETS.PERSONNEL_PHOTOS, filePath);

      // Update personnel record
      await supabaseHelpers.updatePersonnel(personnelId, {
        photo_url: null,
      });

      toast({
        title: "✅ Photo Removed",
        description: "Personnel photo has been removed successfully",
        duration: 3000,
      });

      onPhotoUpdate?.(null);
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Remove Failed",
        description: "Failed to remove photo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const uploadOptions = {
    bucket: STORAGE_BUCKETS.PERSONNEL_PHOTOS,
    folder: `personnel_${badgeNumber}`,
    generateUniqueName: true,
    maxSize: FILE_CONFIGS.IMAGES.maxSize,
    allowedTypes: FILE_CONFIGS.IMAGES.allowedTypes,
  };

  if (!editable) {
    return (
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={currentPhotoUrl} alt={fullName} />
        <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <div className="relative group cursor-pointer">
          <Avatar className={sizeClasses[size]}>
            <AvatarImage src={currentPhotoUrl} alt={fullName} />
            <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-4 h-4 text-white" />
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Personnel Photo</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Photo */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={currentPhotoUrl} alt={fullName} />
              <AvatarFallback className="text-lg">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="font-medium">{fullName}</p>
              <p className="text-sm text-gray-500">Badge: {badgeNumber}</p>
            </div>
          </div>

          {/* File Upload */}
          <FileUpload
            options={uploadOptions}
            config={FILE_CONFIGS.IMAGES}
            onUploadComplete={handleUploadComplete}
            onError={(error) => {
              toast({
                title: "Upload Error",
                description: error,
                variant: "destructive",
              });
            }}
            placeholder="Upload a new photo"
            accept="image/*"
            disabled={isUploading}
            showPreview={false}
          />

          {/* Actions */}
          <div className="flex gap-2">
            {currentPhotoUrl && (
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
  );
}
