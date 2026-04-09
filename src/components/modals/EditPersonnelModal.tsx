import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Loader2, Edit, X } from "lucide-react";
import type { Personnel } from "@/integrations/database";

interface EditPersonnelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personnel: Personnel | null;
  onPersonnelUpdated?: () => void;
}

export default function EditPersonnelModal({
  open,
  onOpenChange,
  personnel,
  onPersonnelUpdated,
}: EditPersonnelModalProps) {
  const { toast } = useToast();
  const { refreshPersonnel } = useAppData();
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
    status: "active",
  });

  // Populate form when personnel data changes
  useEffect(() => {
    if (personnel) {
      setFormData({
        serviceNumber: personnel.service_number || personnel.badge_number,
        pinNumber: personnel.pin_number || "",
        policeOfficeNumber: personnel.police_office_number || "",
        firstName: personnel.first_name,
        lastName: personnel.last_name,
        email: personnel.email,
        phone: personnel.phone || "",
        rank: personnel.rank,
        unit: personnel.unit,
        dateJoined: personnel.date_joined,
        emergencyContacts:
          personnel.emergency_contacts.length > 0
            ? personnel.emergency_contacts
            : ["", ""],
        maritalStatus: personnel.marital_status,
        spouse: personnel.spouse || "",
        childrenCount: personnel.children_count?.toString() || "",
        noChildren: personnel.no_children || false,
        status: personnel.status,
      });
    }
  }, [personnel]);

  const resetForm = () => {
    if (personnel) {
      setFormData({
        serviceNumber: personnel.service_number || personnel.badge_number,
        pinNumber: personnel.pin_number || "",
        policeOfficeNumber: personnel.police_office_number || "",
        firstName: personnel.first_name,
        lastName: personnel.last_name,
        email: personnel.email,
        phone: personnel.phone || "",
        rank: personnel.rank,
        unit: personnel.unit,
        dateJoined: personnel.date_joined,
        emergencyContacts:
          personnel.emergency_contacts.length > 0
            ? personnel.emergency_contacts
            : ["", ""],
        maritalStatus: personnel.marital_status,
        spouse: personnel.spouse || "",
        childrenCount: personnel.children_count?.toString() || "",
        noChildren: personnel.no_children || false,
        status: personnel.status,
      });
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEmergencyContactChange = (index: number, value: string) => {
    const newContacts = [...formData.emergencyContacts];
    newContacts[index] = value;
    setFormData((prev) => ({
      ...prev,
      emergencyContacts: newContacts,
    }));
  };

  const addEmergencyContact = () => {
    setFormData((prev) => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, ""],
    }));
  };

  const removeEmergencyContact = (index: number) => {
    if (formData.emergencyContacts.length > 1) {
      const newContacts = formData.emergencyContacts.filter(
        (_, i) => i !== index
      );
      setFormData((prev) => ({
        ...prev,
        emergencyContacts: newContacts,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personnel) return;

    try {
      setLoading(true);

      // Validate required fields
      if (
        !formData.serviceNumber ||
        !formData.pinNumber ||
        !formData.policeOfficeNumber ||
        !formData.firstName ||
        !formData.lastName ||
        !formData.email ||
        !formData.rank ||
        !formData.unit
      ) {
        toast({
          title: "❌ Validation Error",
          description: "Please fill in all required fields including SN, PN, and PO.",
          variant: "destructive",
        });
        return;
      }

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
        status: formData.status as
          | "active"
          | "inactive"
          | "suspended"
          | "retired",
        updated_at: new Date().toISOString(),
      };

      // Update personnel in Firebase
      console.log("Attempting to update personnel:", personnelData);
      const updatedPersonnel = await db.updatePersonnel(
        personnel.id,
        personnelData
      );

      console.log("Personnel updated successfully:", updatedPersonnel);
      toast({
        title: "✅ Personnel Updated Successfully!",
        description: `${formData.firstName} ${formData.lastName}'s information has been updated`,
        duration: 5000,
        className: "bg-green-50 border-green-200",
      });

      // Close modal first
      onOpenChange(false);

      // Refresh personnel data to get the latest updates
      console.log("Refreshing personnel data after update...");
      await refreshPersonnel();

      // Notify parent component
      if (onPersonnelUpdated) onPersonnelUpdated();

      // Trigger auto-refresh for other components (dashboard, stats, etc.)
      console.log("Triggering auto-refresh for other components...");
      triggerAutoRefresh();
    } catch (error: any) {
      let errorMessage =
        error.message ||
        "Something went wrong. Please check your information and try again.";

      toast({
        title: "❌ Failed to Update Personnel",
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
        className: "bg-red-50 border-red-200",
      });

      console.error("Error updating personnel:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!personnel) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-gray-100">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Edit className="w-4 h-4 text-blue-600" />
            </div>
            Edit Personnel
          </DialogTitle>
          <p className="text-sm text-gray-500 ml-12">
            {personnel.first_name} {personnel.last_name}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">

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
                  onChange={(e) => handleInputChange("serviceNumber", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">PN – Pin Number <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. PN/5678"
                  value={formData.pinNumber}
                  onChange={(e) => handleInputChange("pinNumber", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">PO – Police Office No. <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. PO/9012"
                  value={formData.policeOfficeNumber}
                  onChange={(e) => handleInputChange("policeOfficeNumber", e.target.value)}
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
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs font-medium text-gray-600">Last Name <span className="text-red-500">*</span></Label>
                <Input
                  id="lastName"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">Rank <span className="text-red-500">*</span></Label>
                <Select value={formData.rank} onValueChange={(v) => handleInputChange("rank", v)}>
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
                <Select value={formData.unit} onValueChange={(v) => handleInputChange("unit", v)}>
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
              <div className="space-y-1.5">
                <Label htmlFor="dateJoined" className="text-xs font-medium text-gray-600">Date Joined</Label>
                <Input
                  id="dateJoined"
                  type="date"
                  value={formData.dateJoined}
                  onChange={(e) => handleInputChange("dateJoined", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">Status <span className="text-red-500">*</span></Label>
                <Select value={formData.status} onValueChange={(v) => handleInputChange("status", v)}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
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
                  onChange={(e) => handleInputChange("email", e.target.value)}
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
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-4 w-1 bg-orange-500 rounded-full" />
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Emergency Contacts</h3>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addEmergencyContact} disabled={loading} className="h-7 text-xs px-3">
                + Add Contact
              </Button>
            </div>
            <div className="space-y-2">
              {formData.emergencyContacts.map((contact, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-16 flex-shrink-0">Contact {index + 1}</span>
                  <Input
                    value={contact}
                    onChange={(e) => handleEmergencyContactChange(index, e.target.value)}
                    placeholder="Name & phone number"
                    className="flex-1"
                  />
                  {formData.emergencyContacts.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeEmergencyContact(index)} disabled={loading} className="h-9 w-9 p-0 text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
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
                <Select value={formData.maritalStatus} onValueChange={(v) => handleInputChange("maritalStatus", v)}>
                  <SelectTrigger><SelectValue placeholder="Select marital status" /></SelectTrigger>
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
                    onChange={(e) => handleInputChange("spouse", e.target.value)}
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
                    onChange={(e) => handleInputChange("childrenCount", e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 pb-0.5">
                  <input
                    type="checkbox"
                    id="noChildren"
                    checked={formData.noChildren}
                    onChange={(e) => handleInputChange("noChildren", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <Label htmlFor="noChildren" className="text-sm text-gray-600 cursor-pointer">No children</Label>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="button" variant="outline" onClick={resetForm} disabled={loading}>
              Reset
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Updating...</>
              ) : (
                <><Edit className="w-4 h-4" />Update Personnel</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
