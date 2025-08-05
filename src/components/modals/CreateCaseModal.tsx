import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2, FileText } from "lucide-react";

interface CreateCaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCaseCreated?: () => void;
}

export default function CreateCaseModal({
  open,
  onOpenChange,
  onCaseCreated,
}: CreateCaseModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activePersonnel, setActivePersonnel] = useState<
    {
      id: string;
      first_name: string;
      last_name: string;
      badge_number: string;
      rank: string;
      unit: string;
    }[]
  >([]);
  const [formData, setFormData] = useState({
    caseNumber: "CAS001",
    caseType: "",
    caseTitle: "",
    description: "",
    priority: "Medium",
    assignedTo: "",
    reportedBy: "",
  });

  // Fetch active personnel for assignment
  const fetchActivePersonnel = async () => {
    try {
      console.log("Fetching active personnel from Supabase");

      const allPersonnel = await supabaseHelpers.getPersonnel();

      // Filter active personnel
      const activePersonnel = allPersonnel
        .filter((person) => person.status === "active")
        .sort((a, b) => a.first_name.localeCompare(b.first_name));

      console.log("Active personnel fetched:", activePersonnel.length);
      setActivePersonnel(activePersonnel);
    } catch (error: any) {
      console.error("Error fetching active personnel:", error);
      toast({
        title: "❌ Error",
        description: "Failed to load personnel for assignment",
        variant: "destructive",
      });
    }
  };

  // Load active personnel when modal opens
  useEffect(() => {
    if (open) {
      fetchActivePersonnel();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare case data
      const caseData = {
        case_number: formData.caseNumber,
        case_type: formData.caseType,
        case_title: formData.caseTitle,
        description: formData.description,
        priority: formData.priority.toLowerCase() as
          | "low"
          | "medium"
          | "high"
          | "urgent",
        assigned_to: formData.assignedTo || undefined,
        reported_by: formData.reportedBy,
        status: "open" as const,
      };

      // Insert case into Supabase
      console.log("Creating case in Supabase:", caseData);
      const createdCase = await supabaseHelpers.createCase(caseData);
      console.log("Case created successfully with ID:", createdCase.id);

      toast({
        title: "✅ Case Created Successfully!",
        description: `Case ${formData.caseNumber}: ${formData.caseTitle} has been created and assigned`,
        duration: 5000,
        className: "bg-green-50 border-green-200",
      });

      // Reset form
      setFormData({
        caseNumber: "CAS001",
        caseType: "",
        caseTitle: "",
        description: "",
        priority: "Medium",
        assignedTo: "",
        reportedBy: "",
      });

      // Add delay before closing modal to ensure toast is visible
      setTimeout(() => {
        onOpenChange(false);

        // Refresh cases list
        if (onCaseCreated) {
          onCaseCreated();
        }

        // Notify dashboard to refresh
        window.dispatchEvent(new CustomEvent("case-updated"));
      }, 500);
    } catch (error: any) {
      console.error("Error creating case:", error);

      let errorMessage = "Failed to create case. Please try again.";

      if (error.code === "23505") {
        errorMessage =
          "A case with this number already exists. Please use a different case number.";
      } else if (error.code === "permission-denied") {
        errorMessage = "Permission denied. Please check your access rights.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "❌ Failed to Create Case",
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
        className: "bg-red-50 border-red-200",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Case</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="caseNumber">Case Number</Label>
                <Input
                  id="caseNumber"
                  value={formData.caseNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, caseNumber: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="caseType">Case Type</Label>
                <Select
                  value={formData.caseType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, caseType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select case type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="theft">Theft</SelectItem>
                    <SelectItem value="assault">Assault</SelectItem>
                    <SelectItem value="fraud">Fraud</SelectItem>
                    <SelectItem value="traffic">Traffic Violation</SelectItem>
                    <SelectItem value="domestic">Domestic Violence</SelectItem>
                    <SelectItem value="drugs">Drug Related</SelectItem>
                    <SelectItem value="homicide">Homicide</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="caseTitle">Case Title</Label>
                <Input
                  id="caseTitle"
                  placeholder="Enter case title"
                  value={formData.caseTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, caseTitle: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assign To</Label>
                <Select
                  value={formData.assignedTo}
                  onValueChange={(value) =>
                    setFormData({ ...formData, assignedTo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select officer" />
                  </SelectTrigger>
                  <SelectContent>
                    {activePersonnel.length === 0 ? (
                      <SelectItem value="" disabled>
                        No active personnel available
                      </SelectItem>
                    ) : (
                      activePersonnel.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.first_name} {person.last_name} - {person.rank}{" "}
                          ({person.badge_number})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reportedBy">Reported By</Label>
                <Input
                  id="reportedBy"
                  placeholder="Enter reporter name"
                  value={formData.reportedBy}
                  onChange={(e) =>
                    setFormData({ ...formData, reportedBy: e.target.value })
                  }
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter case description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Case"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
