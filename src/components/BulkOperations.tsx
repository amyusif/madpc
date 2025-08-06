import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CheckSquare,
  Square,
  MoreHorizontal,
  Trash2,
  UserCheck,
  Download,
  Edit,
  Loader2,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabaseHelpers } from "@/integrations/supabase/client";
import { useAutoRefresh } from "@/hooks/useRefresh";
import { exportToCSV, exportToExcel, exportToPDF } from "@/utils/exportUtils";
import type { Personnel } from "@/integrations/supabase/client";

interface BulkOperationsProps {
  selectedPersonnel: Personnel[];
  onSelectionChange: (personnel: Personnel[]) => void;
  allPersonnel: Personnel[];
  onRefresh: () => Promise<void>;
}

export default function BulkOperations({
  selectedPersonnel,
  onSelectionChange,
  allPersonnel,
  onRefresh,
}: BulkOperationsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const { toast } = useToast();
  const triggerAutoRefresh = useAutoRefresh();

  const isAllSelected =
    selectedPersonnel.length === allPersonnel.length && allPersonnel.length > 0;
  const isPartiallySelected =
    selectedPersonnel.length > 0 &&
    selectedPersonnel.length < allPersonnel.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(allPersonnel);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPersonnel.length === 0) return;

    try {
      setIsLoading(true);

      // Delete all selected personnel
      await Promise.all(
        selectedPersonnel.map((person) =>
          supabaseHelpers.deletePersonnel(person.id)
        )
      );

      toast({
        title: "✅ Personnel Deleted Successfully!",
        description: `${selectedPersonnel.length} personnel have been removed from the system.`,
        duration: 4000,
      });

      onSelectionChange([]);
      await onRefresh();
      setShowDeleteDialog(false);

      // Trigger auto-refresh for other components
      triggerAutoRefresh();
    } catch (error: any) {
      console.error("Error deleting personnel:", error);
      toast({
        title: "❌ Failed to Delete Personnel",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedPersonnel.length === 0 || !newStatus) return;

    try {
      setIsLoading(true);

      // Update status for all selected personnel
      await Promise.all(
        selectedPersonnel.map((person) =>
          supabaseHelpers.updatePersonnel(person.id, {
            status: newStatus as
              | "active"
              | "inactive"
              | "suspended"
              | "retired",
          })
        )
      );

      toast({
        title: "✅ Status Updated Successfully!",
        description: `${selectedPersonnel.length} personnel status updated to ${newStatus}.`,
        duration: 4000,
      });

      onSelectionChange([]);
      await onRefresh();
      setShowStatusDialog(false);
      setNewStatus("");

      // Trigger auto-refresh for other components
      triggerAutoRefresh();
    } catch (error: any) {
      console.error("Error updating personnel status:", error);
      toast({
        title: "❌ Failed to Update Status",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkExport = (format: "csv" | "pdf" | "excel") => {
    if (selectedPersonnel.length === 0) {
      toast({
        title: "No Personnel Selected",
        description: "Please select personnel to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `selected-personnel-${timestamp}`;

      switch (format) {
        case "csv":
          exportToCSV(selectedPersonnel, filename);
          break;
        case "excel":
          exportToExcel(selectedPersonnel, filename);
          break;
        case "pdf":
          exportToPDF(selectedPersonnel, filename);
          break;
      }

      toast({
        title: "✅ Export Successful!",
        description: `${
          selectedPersonnel.length
        } personnel exported as ${format.toUpperCase()}.`,
        duration: 4000,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "❌ Export Failed",
        description: "Something went wrong during export. Please try again.",
        variant: "destructive",
      });
    }
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  if (selectedPersonnel.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          className="gap-2"
        >
          {isAllSelected ? (
            <CheckSquare className="w-4 h-4" />
          ) : (
            <Square className="w-4 h-4" />
          )}
          Select All ({allPersonnel.length})
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="gap-2"
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4" />
            ) : isPartiallySelected ? (
              <CheckSquare className="w-4 h-4 opacity-50" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            {isAllSelected ? "Deselect All" : "Select All"}
          </Button>

          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {selectedPersonnel.length} selected
          </Badge>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Status Update */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <UserCheck className="w-4 h-4" />
                Update Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => {
                  setNewStatus("active");
                  setShowStatusDialog(true);
                }}
              >
                Set as Active
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setNewStatus("inactive");
                  setShowStatusDialog(true);
                }}
              >
                Set as Inactive
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setNewStatus("suspended");
                  setShowStatusDialog(true);
                }}
              >
                Set as Suspended
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setNewStatus("retired");
                  setShowStatusDialog(true);
                }}
              >
                Set as Retired
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleBulkExport("csv")}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkExport("excel")}>
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkExport("pdf")}>
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Delete */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>

          {/* Clear Selection */}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Clear
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Personnel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedPersonnel.length}{" "}
              selected personnel? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete {selectedPersonnel.length} Personnel
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Update Confirmation Dialog */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Personnel Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update the status of{" "}
              {selectedPersonnel.length} selected personnel to "{newStatus}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkStatusUpdate}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Update Status
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
