import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Edit,
  Eye,
  UserCheck,
  UserX,
  Loader2,
} from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import { useToast } from "@/hooks/use-toast";
import { supabaseHelpers } from "@/integrations/supabase/client";
import ViewPersonnelModal from "@/components/modals/ViewPersonnelModal";
import EditPersonnelModal from "@/components/modals/EditPersonnelModal";
import type { Personnel } from "@/integrations/supabase/client";

interface PersonnelListProps {
  onAddPersonnel: () => void;
}

export default function PersonnelList({ onAddPersonnel }: PersonnelListProps) {
  const { personnel, refreshPersonnel } = useAppData();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [personnelToDelete, setPersonnelToDelete] = useState<Personnel | null>(
    null
  );
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Filter personnel based on search term
  const filteredPersonnel = personnel.filter(
    (person) =>
      person.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.badge_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.rank.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Generate initials from name
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "suspended":
        return "bg-red-100 text-red-800 border-red-200";
      case "retired":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Handle delete personnel
  const handleDelete = (person: Personnel) => {
    setPersonnelToDelete(person);
    setDeleteDialogOpen(true);
  };

  // Confirm delete personnel
  const confirmDelete = async () => {
    if (!personnelToDelete) return;

    try {
      setIsDeleting(true);

      await supabaseHelpers.deletePersonnel(personnelToDelete.id);

      toast({
        title: "✅ Personnel Deleted Successfully!",
        description: `${personnelToDelete.first_name} ${personnelToDelete.last_name} has been removed from the system.`,
        duration: 4000,
      });

      await refreshPersonnel();
      setDeleteDialogOpen(false);
      setPersonnelToDelete(null);
    } catch (error: any) {
      console.error("Error deleting personnel:", error);
      toast({
        title: "❌ Failed to Delete Personnel",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle edit personnel
  const handleEdit = (person: Personnel) => {
    setSelectedPersonnel(person);
    setEditModalOpen(true);
  };

  // Handle view personnel
  const handleView = (person: Personnel) => {
    setSelectedPersonnel(person);
    setViewModalOpen(true);
  };

  // Handle personnel updated
  const handlePersonnelUpdated = async () => {
    await refreshPersonnel();
    toast({
      title: "✅ Personnel Updated",
      description: "Personnel information has been successfully updated.",
      duration: 4000,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Personnel Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage officers and staff members
          </p>
        </div>
        <Button
          onClick={onAddPersonnel}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Personnel
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search personnel..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {searchTerm && (
          <Badge variant="outline" className="text-gray-600">
            {filteredPersonnel.length} result
            {filteredPersonnel.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Personnel List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredPersonnel.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserX className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {personnel.length === 0
                ? "No Personnel Found"
                : "No Search Results"}
            </h3>
            <p className="text-gray-600 mb-6">
              {personnel.length === 0
                ? "Get started by adding your first personnel member."
                : "Try adjusting your search terms."}
            </p>
            {personnel.length === 0 && (
              <Button onClick={onAddPersonnel} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Personnel
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone Number
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
                {filteredPersonnel.map((person) => (
                  <tr
                    key={person.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src=""
                            alt={`${person.first_name} ${person.last_name}`}
                          />
                          <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                            {getInitials(person.first_name, person.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {person.first_name} {person.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Badge: {person.badge_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize font-medium">
                        {person.rank}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">
                        {person.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {person.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {person.phone || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        className={`${getStatusColor(
                          person.status
                        )} font-medium`}
                        variant="outline"
                      >
                        {person.status.charAt(0).toUpperCase() +
                          person.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => handleView(person)}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEdit(person)}
                            className="cursor-pointer"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(person)}
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
      </div>

      {/* Results count */}
      {filteredPersonnel.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing {filteredPersonnel.length} of {personnel.length} personnel
          </div>
          {/* Pagination can be added here if needed */}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Personnel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>
                {personnelToDelete?.first_name} {personnelToDelete?.last_name}
              </strong>{" "}
              (Badge: {personnelToDelete?.badge_number})? This action cannot be
              undone.
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

      {/* View Personnel Modal */}
      <ViewPersonnelModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        personnel={selectedPersonnel}
      />

      {/* Edit Personnel Modal */}
      <EditPersonnelModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        personnel={selectedPersonnel}
        onPersonnelUpdated={handlePersonnelUpdated}
      />
    </div>
  );
}
