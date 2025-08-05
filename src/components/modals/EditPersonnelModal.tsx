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
import { supabaseHelpers } from "@/integrations/supabase/client";
import { useAppData } from "@/hooks/useAppData";
import { Loader2, Edit, X } from "lucide-react";
import type { Personnel } from "@/integrations/supabase/client";

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
    status: "active",
  });

  // Populate form when personnel data changes
  useEffect(() => {
    if (personnel) {
      setFormData({
        badgeNumber: personnel.badge_number,
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
        badgeNumber: personnel.badge_number,
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
        !formData.firstName ||
        !formData.lastName ||
        !formData.email ||
        !formData.badgeNumber ||
        !formData.rank ||
        !formData.unit
      ) {
        toast({
          title: "❌ Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

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
        status: formData.status as
          | "active"
          | "inactive"
          | "suspended"
          | "retired",
        updated_at: new Date().toISOString(),
      };

      // Update personnel in Supabase
      console.log("Attempting to update personnel:", personnelData);
      await supabaseHelpers.updatePersonnel(personnel.id, personnelData);

      console.log("Personnel updated successfully");
      toast({
        title: "✅ Personnel Updated Successfully!",
        description: `${formData.firstName} ${formData.lastName}'s information has been updated`,
        duration: 5000,
        className: "bg-green-50 border-green-200",
      });

      onOpenChange(false);
      if (onPersonnelUpdated) onPersonnelUpdated();
      await refreshPersonnel();
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Edit className="w-5 h-5 text-blue-600" />
            Edit Personnel - {personnel.first_name} {personnel.last_name}
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Update the personnel information below
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="badgeNumber" className="text-sm font-medium">
                  Badge Number *
                </Label>
                <Input
                  id="badgeNumber"
                  value={formData.badgeNumber}
                  onChange={(e) =>
                    handleInputChange("badgeNumber", e.target.value)
                  }
                  placeholder="e.g., SGT001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">
                  Status *
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  placeholder="Enter first name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">
                  Last Name *
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Professional Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rank" className="text-sm font-medium">
                  Rank *
                </Label>
                <Select
                  value={formData.rank}
                  onValueChange={(value) => handleInputChange("rank", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="constable">Constable</SelectItem>
                    <SelectItem value="corporal">Corporal</SelectItem>
                    <SelectItem value="sergeant">Sergeant</SelectItem>
                    <SelectItem value="inspector">Inspector</SelectItem>
                    <SelectItem value="chief inspector">
                      Chief Inspector
                    </SelectItem>
                    <SelectItem value="superintendent">
                      Superintendent
                    </SelectItem>
                    <SelectItem value="chief superintendent">
                      Chief Superintendent
                    </SelectItem>
                    <SelectItem value="assistant commissioner">
                      Assistant Commissioner
                    </SelectItem>
                    <SelectItem value="deputy commissioner">
                      Deputy Commissioner
                    </SelectItem>
                    <SelectItem value="commissioner">Commissioner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit" className="text-sm font-medium">
                  Unit *
                </Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => handleInputChange("unit", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patrol">Patrol</SelectItem>
                    <SelectItem value="investigation">Investigation</SelectItem>
                    <SelectItem value="traffic">Traffic</SelectItem>
                    <SelectItem value="cybercrime">Cybercrime</SelectItem>
                    <SelectItem value="administration">
                      Administration
                    </SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="special operations">
                      Special Operations
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateJoined" className="text-sm font-medium">
                  Date Joined
                </Label>
                <Input
                  id="dateJoined"
                  type="date"
                  value={formData.dateJoined}
                  onChange={(e) =>
                    handleInputChange("dateJoined", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maritalStatus" className="text-sm font-medium">
                  Marital Status *
                </Label>
                <Select
                  value={formData.maritalStatus}
                  onValueChange={(value) =>
                    handleInputChange("maritalStatus", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select marital status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Married">Married</SelectItem>
                    <SelectItem value="Divorced">Divorced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.maritalStatus === "Married" && (
                <div className="space-y-2">
                  <Label htmlFor="spouse" className="text-sm font-medium">
                    Spouse Name
                  </Label>
                  <Input
                    id="spouse"
                    value={formData.spouse}
                    onChange={(e) =>
                      handleInputChange("spouse", e.target.value)
                    }
                    placeholder="Enter spouse name"
                  />
                </div>
              )}

              {formData.maritalStatus === "Divorced" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Children</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="noChildren"
                        checked={formData.noChildren}
                        onChange={(e) =>
                          handleInputChange("noChildren", e.target.checked)
                        }
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="noChildren" className="text-sm">
                        No children
                      </Label>
                    </div>
                  </div>

                  {!formData.noChildren && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="childrenCount"
                        className="text-sm font-medium"
                      >
                        Number of Children
                      </Label>
                      <Input
                        id="childrenCount"
                        type="number"
                        min="0"
                        value={formData.childrenCount}
                        onChange={(e) =>
                          handleInputChange("childrenCount", e.target.value)
                        }
                        placeholder="Enter number of children"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Emergency Contacts
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEmergencyContact}
                disabled={loading}
              >
                Add Contact
              </Button>
            </div>

            <div className="space-y-3">
              {formData.emergencyContacts.map((contact, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={contact}
                    onChange={(e) =>
                      handleEmergencyContactChange(index, e.target.value)
                    }
                    placeholder={`Emergency contact ${index + 1}`}
                    className="flex-1"
                  />
                  {formData.emergencyContacts.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeEmergencyContact(index)}
                      disabled={loading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={loading}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Update Personnel
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
