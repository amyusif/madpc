import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAppData } from "@/hooks/useAppData";
import { useAutoRefresh } from "@/hooks/useRefresh";
import { supabaseHelpers } from "@/integrations/supabase/client";
import { AlertTriangle, Loader2, Trash2 as TrashIcon } from "lucide-react";

interface DeleteCaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseData: {
    id: string;
    case_number: string;
    case_title: string;
  } | null;
}

export default function DeleteCaseModal({
  open,
  onOpenChange,
  caseData,
}: DeleteCaseModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { refreshCases } = useAppData();
  const triggerAutoRefresh = useAutoRefresh();

  const handleDelete = async () => {
    if (!caseData) return;

    try {
      setLoading(true);

      console.log("Attempting to delete case:", caseData.id);

      // Delete case from Supabase
      await supabaseHelpers.deleteCase(caseData.id);

      console.log("Case deleted successfully");

      toast({
        title: "✅ Case Deleted Successfully!",
        description: `Case ${caseData.case_number}: ${caseData.case_title} has been removed from the system`,
        duration: 5000,
        className: "bg-green-50 border-green-200",
      });

      // Refresh cases data immediately
      await refreshCases();

      // Trigger auto-refresh for other components
      triggerAutoRefresh();

      // Add delay before closing modal to ensure toast is visible
      setTimeout(() => {
        onOpenChange(false);
      }, 500);
    } catch (error: any) {
      console.error("Error deleting case:", error);

      let errorMessage = "Failed to delete case. Please try again.";

      if (error.code === "permission-denied") {
        errorMessage =
          "Permission denied. You don't have access to delete this case.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "❌ Failed to Delete Case",
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Delete Case
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this case? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        {caseData && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <div>
                <span className="font-medium">Case Number:</span>{" "}
                {caseData.case_number}
              </div>
              <div>
                <span className="font-medium">Case Title:</span>{" "}
                {caseData.case_title}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <TrashIcon className="w-4 h-4" />
                Delete Case
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
