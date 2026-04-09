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
import { db } from "@/integrations/database";
import { useAppData } from "@/hooks/useAppData";
import { useAutoRefresh } from "@/hooks/useRefresh";
import { FileUpload } from "@/components/ui/file-upload";
import { FILE_CONFIGS, STORAGE_BUCKETS, type FileUploadResult } from "@/utils/fileStorage";
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
    serviceNumber: "",
    pinNumber: "",
    policeOfficeNumber: "",
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
  const handleImageUpload = useCallback((result: FileUploadResult) => {
    if (result.success && result.url) {
      setSelectedImage(result.url);
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
      if (!formData.serviceNumber.trim())
        throw new Error("Service Number (SN) is required");
      if (!formData.pinNumber.trim())
        throw new Error("Pin Number (PN) is required");
      if (!formData.policeOfficeNumber.trim())
        throw new Error("Police Office Number (PO) is required");
      if (!formData.firstName.trim()) throw new Error("First name is required");
      if (!formData.lastName.trim()) throw new Error("Last name is required");
      if (!formData.email.trim()) throw new Error("Email is required");
      if (!formData.rank) throw new Error("Rank is required");
      if (!formData.unit) throw new Error("Unit is required");

      const personnelData = {
        badge_number: formData.serviceNumber,
        service_number: formData.serviceNumber,
        pin_number: formData.pinNumber,
        police_office_number: formData.policeOfficeNumber,
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

      // Insert personnel into Firebase
      console.log("Attempting to save to Firebase:", personnelData);
      const newPersonnel = await db.createPersonnel(personnelData);
      console.log("Personnel saved successfully with ID:", newPersonnel.id);
      toast({
        title: "✅ Personnel Added Successfully!",
        description: `${formData.firstName} ${formData.lastName} (SN: ${formData.serviceNumber}) has been added to the system`,
        duration: 5000,
        className: "bg-green-50 border-green-200",
      });

      console.log("Toast notification sent for successful personnel creation");

      // Reset form data and image
      setFormData({
        serviceNumber: "",
        pinNumber: "",
        policeOfficeNumber: "",
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-gray-100">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-4 h-4 text-blue-600" />
            </div>
            Add New Personnel
          </DialogTitle>
          <p className="text-sm text-gray-500 ml-12">Fill in all required fields to register a new officer</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">

          {/* Photo */}
          <div className="rounded-xl bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Camera className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">Personnel Photo</span>
              <span className="text-xs text-gray-400 bg-white border border-gray-200 rounded-full px-2 py-0.5">Optional</span>
            </div>
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 ring-2 ring-white shadow">
                <AvatarImage src={selectedImage || undefined} />
                <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-sm">
                  {formData.firstName && formData.lastName
                    ? `${formData.firstName[0]}${formData.lastName[0]}`.toUpperCase()
                    : <Camera className="w-5 h-5 text-blue-400" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1.5">
                <FileUpload
                  bucket={STORAGE_BUCKETS.PERSONNEL_PHOTOS}
                  folder={`personnel/${formData.serviceNumber || "unknown"}`}
                  config={FILE_CONFIGS.IMAGES}
                  onUploadComplete={handleImageUpload}
                  onError={handleImageError}
                  multiple={false}
                  accept="image/*"
                  placeholder="Choose personnel photo"
                  disabled={imageUploading}
                />
                {selectedImage && (
                  <button type="button" onClick={removeImage} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
                    <X className="w-3 h-3" /> Remove photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Identification Numbers */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-4 w-1 bg-blue-600 rounded-full" />
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Identification Numbers</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">SN – Service Number <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. SN/1234"
                  value={formData.serviceNumber}
                  onChange={(e) => setFormData({ ...formData, serviceNumber: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">PN – Pin Number <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. PN/5678"
                  value={formData.pinNumber}
                  onChange={(e) => setFormData({ ...formData, pinNumber: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">PO – Police Office No. <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. PO/9012"
                  value={formData.policeOfficeNumber}
                  onChange={(e) => setFormData({ ...formData, policeOfficeNumber: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-4 w-1 bg-emerald-500 rounded-full" />
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Personal Details</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs font-medium text-gray-600">First Name <span className="text-red-500">*</span></Label>
                <Input
                  id="firstName"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs font-medium text-gray-600">Last Name <span className="text-red-500">*</span></Label>
                <Input
                  id="lastName"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">Rank <span className="text-red-500">*</span></Label>
                <Select value={formData.rank} onValueChange={(v) => setFormData({ ...formData, rank: v })}>
                  <SelectTrigger><SelectValue placeholder="Select rank" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="constable">Constable</SelectItem>
                    <SelectItem value="lance_corporal">Lance Corporal</SelectItem>
                    <SelectItem value="corporal">Corporal</SelectItem>
                    <SelectItem value="sergeant">Sergeant</SelectItem>
                    <SelectItem value="inspector">Inspector</SelectItem>
                    <SelectItem value="chief_inspector">Chief Inspector</SelectItem>
                    <SelectItem value="assistant_superintendent">Assistant Superintendent</SelectItem>
                    <SelectItem value="deputy_superintendent">Deputy Superintendent</SelectItem>
                    <SelectItem value="superintendent">Superintendent</SelectItem>
                    <SelectItem value="chief_superintendent">Chief Superintendent</SelectItem>
                    <SelectItem value="assistant_commissioner">Assistant Commissioner</SelectItem>
                    <SelectItem value="deputy_commissioner">Deputy Commissioner</SelectItem>
                    <SelectItem value="commissioner">Commissioner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">Unit <span className="text-red-500">*</span></Label>
                <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                  <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patrol">Patrol Unit</SelectItem>
                    <SelectItem value="investigation">Investigation Unit</SelectItem>
                    <SelectItem value="traffic">Traffic Unit</SelectItem>
                    <SelectItem value="cybercrime">Cybercrime Unit</SelectItem>
                    <SelectItem value="administration">Administration</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="special operations">Special Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-1">
                <Label htmlFor="dateJoined" className="text-xs font-medium text-gray-600">Date Joined</Label>
                <Input
                  id="dateJoined"
                  type="date"
                  value={formData.dateJoined}
                  onChange={(e) => setFormData({ ...formData, dateJoined: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-4 w-1 bg-violet-500 rounded-full" />
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Contact Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-gray-600">Email Address <span className="text-red-500">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="officer@police.gov.gh"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-medium text-gray-600">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+233XXXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-4 w-1 bg-orange-500 rounded-full" />
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Emergency Contacts</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">Contact 1</Label>
                <Input
                  placeholder="Name & phone number"
                  value={formData.emergencyContacts[0]}
                  onChange={(e) => {
                    const u = [...formData.emergencyContacts];
                    u[0] = e.target.value;
                    setFormData({ ...formData, emergencyContacts: u });
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">Contact 2 <span className="text-gray-400 font-normal">(optional)</span></Label>
                <Input
                  placeholder="Name & phone number"
                  value={formData.emergencyContacts[1]}
                  onChange={(e) => {
                    const u = [...formData.emergencyContacts];
                    u[1] = e.target.value;
                    setFormData({ ...formData, emergencyContacts: u });
                  }}
                />
              </div>
            </div>
          </div>

          {/* Family Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-4 w-1 bg-rose-500 rounded-full" />
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Family Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">Marital Status</Label>
                <Select
                  value={formData.maritalStatus}
                  onValueChange={(v) => setFormData({ ...formData, maritalStatus: v, spouse: "", childrenCount: "", noChildren: false })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Married">Married</SelectItem>
                    <SelectItem value="Divorced">Divorced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.maritalStatus === "Married" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-600">Spouse Name</Label>
                  <Input
                    placeholder="Enter spouse name"
                    value={formData.spouse}
                    onChange={(e) => setFormData({ ...formData, spouse: e.target.value })}
                  />
                </div>
              )}
            </div>
            {formData.maritalStatus === "Divorced" && (
              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-600">Number of Children</Label>
                  <Input
                    type="number"
                    min="0"
                    disabled={formData.noChildren}
                    placeholder="Enter number"
                    value={formData.childrenCount}
                    onChange={(e) => setFormData({ ...formData, childrenCount: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2 pb-0.5">
                  <input
                    type="checkbox"
                    id="noChildren"
                    checked={formData.noChildren}
                    onChange={(e) => setFormData({ ...formData, noChildren: e.target.checked, childrenCount: e.target.checked ? "" : formData.childrenCount })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  <Label htmlFor="noChildren" className="text-sm text-gray-600 cursor-pointer">No children</Label>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="px-6">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="px-6 bg-blue-600 hover:bg-blue-700 text-white gap-2">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Creating...</>
              ) : (
                <><UserPlus className="w-4 h-4" />Create Personnel</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
