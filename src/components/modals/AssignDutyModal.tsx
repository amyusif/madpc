import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppData } from "@/hooks/useAppData";
import { useToast } from "@/hooks/use-toast";
import { supabaseHelpers } from "@/integrations/supabase/client";
import { X, Loader2, Calendar } from "lucide-react";

// Force recompilation

interface AssignDutyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDutyAssigned?: () => void;
}

export function AssignDutyModal({
  open,
  onOpenChange,
  onDutyAssigned,
}: AssignDutyModalProps) {
  const { personnel, refreshDuties } = useAppData();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    dutyTitle: "",
    description: "",
    assignTo: "",
    location: "",
    startTime: "",
    endTime: "",
  });

  const resetForm = () => {
    setFormData({
      dutyTitle: "",
      description: "",
      assignTo: "",
      location: "",
      startTime: "",
      endTime: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.dutyTitle.trim()) throw new Error("Duty title is required");
      if (!formData.assignTo) throw new Error("Please select an officer");
      if (!formData.startTime) throw new Error("Start time is required");
      const selectedPersonnel = personnel.find(
        (p) => p.id === formData.assignTo
      );
      if (!selectedPersonnel) throw new Error("Selected personnel not found");
      const dutyData = {
        personnel_id: formData.assignTo,
        duty_type: formData.dutyTitle, // Using duty_title as duty_type
        description: formData.description,
        location: formData.location || "Not specified",
        start_time: new Date(formData.startTime).toISOString(),
        end_time: formData.endTime
          ? new Date(formData.endTime).toISOString()
          : undefined,
        status: "assigned" as const,
        notes: `Assigned to ${selectedPersonnel.first_name} ${selectedPersonnel.last_name} (${selectedPersonnel.badge_number})`,
      };

      // Insert duty into Supabase
      console.log("Attempting to save duty to Supabase:", dutyData);
      const createdDuty = await supabaseHelpers.createDuty(dutyData);
      console.log("Duty saved successfully with ID:", createdDuty.id);
      toast({
        title: "✅ Duty Assigned Successfully!",
        description: `"${formData.dutyTitle}" has been assigned to ${selectedPersonnel.first_name} ${selectedPersonnel.last_name} (${selectedPersonnel.badge_number})`,
        duration: 5000,
      });
      resetForm();

      // Add delay before closing modal to ensure toast is visible
      setTimeout(() => {
        onOpenChange(false);
        if (onDutyAssigned) onDutyAssigned();
      }, 500);
      await refreshDuties();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "Failed to assign duty. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Assign New Duty
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {/* Duty Title */}
          <div className="space-y-2">
            <Label
              htmlFor="dutyTitle"
              className="text-sm font-medium text-blue-600"
            >
              Duty Title
            </Label>
            <Input
              id="dutyTitle"
              placeholder="Enter duty title"
              value={formData.dutyTitle}
              onChange={(e) =>
                setFormData({ ...formData, dutyTitle: e.target.value })
              }
              required
              className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-sm font-medium text-blue-600"
            >
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Enter duty description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Assign To and Location Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="assignTo"
                className="text-sm font-medium text-blue-600"
              >
                Assign To
              </Label>
              <Select
                value={formData.assignTo}
                onValueChange={(value) =>
                  setFormData({ ...formData, assignTo: value })
                }
              >
                <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Select officer" />
                </SelectTrigger>
                <SelectContent>
                  {personnel.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">
                      No active personnel available
                    </div>
                  ) : (
                    personnel
                      .filter((p) => p.status === "active")
                      .map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.first_name} {person.last_name} - {person.rank}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="location"
                className="text-sm font-medium text-blue-600"
              >
                Location
              </Label>
              <Input
                id="location"
                placeholder="Enter duty location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Start Time and End Time Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="startTime"
                className="text-sm font-medium text-blue-600"
              >
                Start Time
              </Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                required
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="endTime"
                className="text-sm font-medium text-blue-600"
              >
                End Time
              </Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="px-6 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !formData.dutyTitle ||
                !formData.assignTo ||
                !formData.startTime
              }
              className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? "Assigning..." : "Assign Duty"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
