import { useState } from "react";
import { supabaseHelpers } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAppData } from "@/hooks/useAppData";
import { useAutoRefresh } from "@/hooks/useRefresh";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface AddCaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCaseAdded?: () => void;
}

export default function AddCaseModal({
  open,
  onOpenChange,
  onCaseAdded,
}: AddCaseModalProps) {
  const [formData, setFormData] = useState({
    caseNumber: "",
    caseTitle: "",
    caseType: "",
    priority: "",
    reportedBy: "",
    reportedDate: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { refreshCases } = useAppData();
  const triggerAutoRefresh = useAutoRefresh();

  const resetForm = () => {
    setFormData({
      caseNumber: "",
      caseTitle: "",
      caseType: "",
      priority: "",
      reportedBy: "",
      reportedDate: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validation
      if (
        !formData.caseNumber.trim() ||
        !formData.caseTitle.trim() ||
        !formData.caseType.trim() ||
        !formData.priority.trim() ||
        !formData.reportedBy.trim() ||
        !formData.reportedDate.trim()
      ) {
        throw new Error("All fields are required");
      }
      const newCase = {
        case_number: formData.caseNumber,
        case_title: formData.caseTitle,
        case_type: formData.caseType,
        priority: formData.priority as "low" | "medium" | "high" | "urgent",
        reported_by: formData.reportedBy,
        status: "open" as const,
        description: `Reported on ${formData.reportedDate}`,
      };

      // Insert case into Supabase
      console.log("Attempting to save to Supabase:", newCase);
      const createdCase = await supabaseHelpers.createCase(newCase);
      console.log("Case saved successfully with ID:", createdCase.id);
      toast({
        title: "✅ Case Created Successfully!",
        description: `Case ${formData.caseNumber}: ${formData.caseTitle} has been added to the system`,
        duration: 5000,
      });
      resetForm();

      // Close modal and refresh data
      onOpenChange(false);
      if (onCaseAdded) onCaseAdded();

      // Refresh cases data immediately
      await refreshCases();

      // Trigger auto-refresh for other components
      triggerAutoRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add case",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Case</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Case Number</Label>
            <Input
              placeholder="Case Number"
              value={formData.caseNumber}
              onChange={(e) =>
                setFormData({ ...formData, caseNumber: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Case Title</Label>
            <Input
              placeholder="Case Title"
              value={formData.caseTitle}
              onChange={(e) =>
                setFormData({ ...formData, caseTitle: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Case Type</Label>
            <Input
              placeholder="Type (e.g. Theft, Assault)"
              value={formData.caseType}
              onChange={(e) =>
                setFormData({ ...formData, caseType: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) =>
                setFormData({ ...formData, priority: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Reported By</Label>
            <Input
              placeholder="Reporter Name"
              value={formData.reportedBy}
              onChange={(e) =>
                setFormData({ ...formData, reportedBy: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Reported Date</Label>
            <Input
              type="date"
              value={formData.reportedDate}
              onChange={(e) =>
                setFormData({ ...formData, reportedDate: e.target.value })
              }
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Case"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
