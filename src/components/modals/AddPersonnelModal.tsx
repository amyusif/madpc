import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabaseHelpers } from "@/integrations/supabase/client";
import { useAppData } from "@/hooks/useAppData";
import { useAutoRefresh } from "@/hooks/useRefresh";
import { UploadThingUpload } from "@/components/ui/uploadthing-upload";
import { Loader2, UserPlus, Camera, X } from "lucide-react";

interface AddPersonnelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPersonnelAdded?: () => void;
}

export default function AddPersonnelModal({
  open,
  onOpenChange,
  onPersonnelAdded,
}: AddPersonnelModalProps) {
  const { toast } = useToast();
  const triggerAutoRefresh = useAutoRefresh();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    badgeNumber: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    rank: "",
    unit: "",
    dateJoined: "",
    emergencyContacts: ["", ""],
    maritalStatus: "Single",
    spouse: "",
    childrenCount: "",
    noChildren: false,
  });

  // Image upload state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  const { refreshPersonnel } = useAppData();

  // Handle image upload completion
  const handleImageUpload = useCallback((files: { url: string; name: string; size: number }[]) => {
    if (files.length > 0) {
      setSelectedImage(files[0].url);
      toast({
        title: "✅ Image Uploaded",
        description: "Personnel photo uploaded successfully",
      });
    }
  }, [toast]);

  // Handle image upload error
  const handleImageError = useCallback((error: string) => {
    toast({
      title: "❌ Upload Failed",
      description: error,
      variant: "destructive",
    });
  }, [toast]);

  // Remove selected image
  const removeImage = useCallback(() => {
    setSelectedImage(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validate required fields
      if (!formData.badgeNumber.trim())
        throw new Error("Badge number is required");
      if (!formData.firstName.trim()) throw new Error("First name is required");
      if (!formData.lastName.trim()) throw new Error("Last name is required");
      if (!formData.email.trim()) throw new Error("Email is required");
      if (!formData.rank) throw new Error("Rank is required");
      if (!formData.unit) throw new Error("Unit is required");

      const personnelData = {
        badge_number: formData.badgeNumber,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        rank: formData.rank,
        unit: formData.unit,
        date_joined:
          formData.dateJoined || new Date().toISOString().split("T")[0],
        emergency_contacts: formData.emergencyContacts.filter((c) => c),
        marital_status: formData.maritalStatus,
        spouse: formData.maritalStatus === "Married" ? formData.spouse : "",
        children_count:
          formData.maritalStatus === "Divorced" && !formData.noChildren
            ? parseInt(formData.childrenCount) || 0
            : formData.maritalStatus === "Divorced" && formData.noChildren
            ? 0
            : undefined,
        no_children:
          formData.maritalStatus === "Divorced" ? formData.noChildren : false,
        status: "active" as const,
        // Store UploadThing image URL in Firebase
        photo_url: selectedImage || null,
      };

      // Insert personnel into Supabase
      console.log("Attempting to save to Supabase:", personnelData);
      const newPersonnel = await supabaseHelpers.createPersonnel(personnelData);
      console.log("Personnel saved successfully with ID:", newPersonnel.id);
      toast({
        title: "✅ Personnel Added Successfully!",
        description: `${formData.firstName} ${formData.lastName} (Badge: ${formData.badgeNumber}) has been added to the system`,
        duration: 5000,
        className: "bg-green-50 border-green-200",
      });

      console.log("Toast notification sent for successful personnel creation");

      // Reset form data and image
      setFormData({
        badgeNumber: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        rank: "",
        unit: "",
        dateJoined: "",
        emergencyContacts: ["", ""],
        maritalStatus: "Single",
        spouse: "",
        childrenCount: "",
        noChildren: false,
      });
      setSelectedImage(null);

      // Close modal and trigger refresh
      onOpenChange(false);
      if (onPersonnelAdded) onPersonnelAdded();
      await refreshPersonnel();

      // Trigger auto-refresh for other components
      triggerAutoRefresh();
    } catch (error: any) {
      let errorMessage =
        error.message ||
        "Something went wrong. Please check your information and try again.";
      if (error.code === "permission-denied")
        errorMessage =
          "Permission denied. Please check your Firebase security rules.";
      else if (error.code === "unavailable")
        errorMessage =
          "Firebase service is currently unavailable. Please try again later.";
      toast({
        title: "❌ Failed to Add Personnel",
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
        className: "bg-red-50 border-red-200",
      });

      console.log(
        "Toast notification sent for personnel creation error:",
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Add New Personnel
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Fill in the details below to add a new officer to the system
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personnel Photo Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 text-blue-600" />
              <Label className="text-base font-medium">Personnel Photo</Label>
              <span className="text-sm text-gray-500">(Optional)</span>
            </div>

            <div className="flex items-start gap-4">
              {/* Photo Preview */}
              <div className="flex-shrink-0">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={selectedImage || undefined} alt="Personnel photo" />
                  <AvatarFallback className="text-lg bg-gray-200">
                    {formData.firstName && formData.lastName
                      ? `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`.toUpperCase()
                      : <Camera className="w-8 h-8 text-gray-400" />
                    }
                  </AvatarFallback>
                </Avatar>
                {selectedImage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeImage}
                    className="mt-2 w-20 h-8 text-xs"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Remove
                  </Button>
                )}
              </div>

              {/* Upload Section */}
              <div className="flex-1">
                <UploadThingUpload
                  endpoint="personnelPhotos"
                  onUploadComplete={handleImageUpload}
                  onUploadError={handleImageError}
                  maxFiles={1}
                  accept="image/*"
                  placeholder="Choose personnel photo"
                  disabled={imageUploading}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Images are stored securely via UploadThing CDN. Only the URL is saved in Firebase.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="badgeNumber">Badge Number</Label>
                <Input
                  id="badgeNumber"
                  value={formData.badgeNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, badgeNumber: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) =>
                    setFormData({ ...formData, unit: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patrol">Patrol Unit</SelectItem>
                    <SelectItem value="investigation">
                      Investigation Unit
                    </SelectItem>
                    <SelectItem value="traffic">Traffic Unit</SelectItem>
                    <SelectItem value="admin">Administration</SelectItem>
                    <SelectItem value="special">Special Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+233XXXXXXXXX or 0XXXXXXXXX"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Include country code for SMS notifications (e.g., +233 for Ghana)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateJoined">Date Joined</Label>
                <Input
                  id="dateJoined"
                  type="date"
                  value={formData.dateJoined}
                  onChange={(e) =>
                    setFormData({ ...formData, dateJoined: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rank">Rank</Label>
                <Select
                  value={formData.rank}
                  onValueChange={(value) =>
                    setFormData({ ...formData, rank: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="constable">Constable</SelectItem>
                    <SelectItem value="corporal">Corporal</SelectItem>
                    <SelectItem value="sergeant">Sergeant</SelectItem>
                    <SelectItem value="inspector">Inspector</SelectItem>
                    <SelectItem value="chief_inspector">
                      Chief Inspector
                    </SelectItem>
                    <SelectItem value="superintendent">
                      Superintendent
                    </SelectItem>
                    <SelectItem value="chief_superintendent">
                      Chief Superintendent
                    </SelectItem>
                    <SelectItem value="assistant_commissioner">
                      Assistant Commissioner
                    </SelectItem>
                    <SelectItem value="deputy_commissioner">
                      Deputy Commissioner
                    </SelectItem>
                    <SelectItem value="commissioner">Commissioner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="col-span-2 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Emergency Contact 1</Label>
              <Input
                placeholder="Name & Phone"
                value={formData.emergencyContacts[0]}
                onChange={(e) => {
                  const updated = [...formData.emergencyContacts];
                  updated[0] = e.target.value;
                  setFormData({ ...formData, emergencyContacts: updated });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Emergency Contact 2</Label>
              <Input
                placeholder="Name & Phone (optional)"
                value={formData.emergencyContacts[1]}
                onChange={(e) => {
                  const updated = [...formData.emergencyContacts];
                  updated[1] = e.target.value;
                  setFormData({ ...formData, emergencyContacts: updated });
                }}
              />
            </div>
          </div>

          {/* Marital Status */}
          <div className="col-span-2 space-y-2">
            <Label>Marital Status</Label>
            <Select
              value={formData.maritalStatus}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  maritalStatus: value,
                  spouse: "",
                  childrenCount: "",
                  noChildren: false,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Single">Single</SelectItem>
                <SelectItem value="Married">Married</SelectItem>
                <SelectItem value="Divorced">Divorced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditional Spouse/Children Fields */}
          {formData.maritalStatus === "Married" && (
            <div className="col-span-2 space-y-2">
              <Label>Spouse Name</Label>
              <Input
                placeholder="Spouse Name"
                value={formData.spouse}
                onChange={(e) =>
                  setFormData({ ...formData, spouse: e.target.value })
                }
              />
            </div>
          )}
          {formData.maritalStatus === "Divorced" && (
            <div className="col-span-2 grid grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label>Number of Children</Label>
                <Input
                  type="number"
                  min="0"
                  disabled={formData.noChildren}
                  placeholder="Enter number"
                  value={formData.childrenCount}
                  onChange={(e) =>
                    setFormData({ ...formData, childrenCount: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  id="noChildren"
                  checked={formData.noChildren}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      noChildren: e.target.checked,
                      childrenCount: e.target.checked
                        ? ""
                        : formData.childrenCount,
                    })
                  }
                />
                <Label htmlFor="noChildren">I don't have children</Label>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="px-6 bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Personnel...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Personnel
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
