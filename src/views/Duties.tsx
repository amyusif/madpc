import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Plus, Search, Calendar, User, Clock, MapPin, MoreHorizontal, Edit, Trash2, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import { useToast } from "@/hooks/use-toast";
import { supabaseHelpers } from "@/integrations/supabase/client";
import { AssignDutyModal } from "@/components/modals/AssignDutyModal";
import type { Duty } from "@/integrations/supabase/client";

export default function Duties() {
  const { duties, personnel, refreshDuties, loading } = useAppData();
  const [showAssignDutyModal, setShowAssignDutyModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dutyToDelete, setDutyToDelete] = useState<Duty | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-lg text-gray-500">Loading duties...</span>
      </div>
    );
  }

  // Get personnel info for each duty
  const dutiesWithPersonnel = duties.map((duty) => {
    const assignedPersonnel = personnel.find((p) => p.id === duty.personnel_id);
    return {
      ...duty,
      personnel_name: assignedPersonnel
        ? `${assignedPersonnel.first_name} ${assignedPersonnel.last_name}`
        : "Unknown",
      personnel_badge: assignedPersonnel?.badge_number || "N/A",
      personnel_rank: assignedPersonnel?.rank || "N/A",
    };
  });

  // Filter duties based on search term
  const filteredDuties = dutiesWithPersonnel.filter(
    (duty) =>
      duty.personnel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      duty.duty_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (duty.location &&
        duty.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDelete = (duty: Duty) => {
    setDutyToDelete(duty);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!dutyToDelete) return;
    setIsDeleting(true);
    try {
      await supabaseHelpers.deleteDuty(dutyToDelete.id);
      toast({
        title: "✅ Duty Deleted",
        description: `Duty "${dutyToDelete.duty_type}" has been deleted.`,
      });
      refreshDuties();
    } catch (error: any) {
      toast({
        title: "❌ Delete Failed",
        description: error?.message || "Failed to delete duty",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setDutyToDelete(null);
    }
  };

  const handleStatusUpdate = async (duty: Duty, newStatus: string) => {
    try {
      await supabaseHelpers.updateDuty(duty.id, { status: newStatus as any });
      toast({
        title: "✅ Status Updated",
        description: `Duty status changed to ${newStatus.replace("_", " ")}`,
      });
      refreshDuties();
    } catch (error: any) {
      toast({
        title: "❌ Update Failed",
        description: error?.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Duty Management</h1>
          <p className="text-muted-foreground">
            Assign and track personnel duties
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowAssignDutyModal(true)}>
          <Plus className="w-4 h-4" />
          Assign Duty
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search duties..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Duties Table */}
      {filteredDuties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="w-16 h-16 text-muted-foreground/50 mb-6" />
            <h3 className="text-lg font-semibold mb-2">
              {duties.length === 0 ? "No Duties Found" : "No matching duties"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {duties.length === 0
                ? "Get started by assigning your first duty. Schedule patrols, assign locations, and track duty completion."
                : "Try adjusting your search terms to find what you're looking for."}
            </p>
            {duties.length === 0 && (
              <Button
                className="gap-2"
                onClick={() => setShowAssignDutyModal(true)}
              >
                <Plus className="w-4 h-4" />
                Assign Duty
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duty Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Personnel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDuties.map((duty) => (
                <tr key={duty.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {duty.duty_type}
                    </div>
                    {duty.notes && (
                      <div className="text-sm text-gray-500 line-clamp-1">
                        {duty.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{duty.personnel_name}</div>
                    <div className="text-sm text-gray-500">{duty.personnel_badge} • {duty.personnel_rank}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{duty.location || "N/A"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(duty.start_time).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(duty.start_time).toLocaleTimeString()} - {" "}
                      {duty.end_time ? new Date(duty.end_time).toLocaleTimeString() : "Ongoing"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getStatusColor(duty.status)}>
                      {duty.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {duty.status !== "completed" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(duty, "completed")}
                            className="cursor-pointer"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark Complete
                          </DropdownMenuItem>
                        )}
                        {duty.status !== "cancelled" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(duty, "cancelled")}
                            className="cursor-pointer"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel Duty
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDelete(duty)}
                          className="cursor-pointer text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Duty</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the duty "{dutyToDelete?.duty_type}"
              assigned to {dutyToDelete ? filteredDuties.find(d => d.id === dutyToDelete.id)?.personnel_name : ""}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Duty Modal */}
      <AssignDutyModal
        open={showAssignDutyModal}
        onOpenChange={setShowAssignDutyModal}
        onDutyAssigned={refreshDuties}
      />
    </div>
  );
}
