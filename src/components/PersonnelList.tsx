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
  Download,
  Upload,
} from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import { useToast } from "@/hooks/use-toast";
import { supabaseHelpers } from "@/integrations/supabase/client";
import ViewPersonnelModal from "@/components/modals/ViewPersonnelModal";
import EditPersonnelModal from "@/components/modals/EditPersonnelModal";
import ExportModal from "@/components/modals/ExportModal";
import ImportModal from "@/components/modals/ImportModal";
import PersonnelFilters, {
  PersonnelFilters as FilterType,
} from "@/components/PersonnelFilters";
import BulkOperations from "@/components/BulkOperations";
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
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [personnelToDelete, setPersonnelToDelete] = useState<Personnel | null>(
    null
  );
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(
    null
  );
  const [bulkSelectedPersonnel, setBulkSelectedPersonnel] = useState<
    Personnel[]
  >([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sortField, setSortField] = useState<keyof Personnel | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState<FilterType>({
    status: [],
    rank: [],
    unit: [],
    dateJoinedFrom: "",
    dateJoinedTo: "",
    maritalStatus: [],
  });
  const { toast } = useToast();

  // Apply filters and search
  const filteredPersonnel = personnel.filter((person) => {
    // Search filter
    const searchMatch =
      !searchTerm ||
      person.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.badge_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.rank.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const statusMatch =
      filters.status.length === 0 || filters.status.includes(person.status);

    // Rank filter
    const rankMatch =
      filters.rank.length === 0 || filters.rank.includes(person.rank);

    // Unit filter
    const unitMatch =
      filters.unit.length === 0 || filters.unit.includes(person.unit);

    // Marital status filter
    const maritalMatch =
      filters.maritalStatus.length === 0 ||
      filters.maritalStatus.includes(person.marital_status);

    // Date range filter
    const dateJoined = new Date(person.date_joined);
    const dateFromMatch =
      !filters.dateJoinedFrom || dateJoined >= new Date(filters.dateJoinedFrom);
    const dateToMatch =
      !filters.dateJoinedTo || dateJoined <= new Date(filters.dateJoinedTo);

    return (
      searchMatch &&
      statusMatch &&
      rankMatch &&
      unitMatch &&
      maritalMatch &&
      dateFromMatch &&
      dateToMatch
    );
  });

  // Apply sorting
  const sortedPersonnel = [...filteredPersonnel].sort((a, b) => {
    if (!sortField) return 0;

    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    let comparison = 0;
    if (typeof aValue === "string" && typeof bValue === "string") {
      comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
    } else if (aValue instanceof Date && bValue instanceof Date) {
      comparison = aValue.getTime() - bValue.getTime();
    } else {
      comparison = String(aValue).localeCompare(String(bValue));
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Apply pagination
  const totalPages = Math.ceil(sortedPersonnel.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPersonnel = sortedPersonnel.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Count active filters
  const activeFilterCount =
    filters.status.length +
    filters.rank.length +
    filters.unit.length +
    filters.maritalStatus.length +
    (filters.dateJoinedFrom ? 1 : 0) +
    (filters.dateJoinedTo ? 1 : 0);

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

  // Handle sorting
  const handleSort = (field: keyof Personnel) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Handle bulk selection
  const handleBulkSelection = (person: Personnel, checked: boolean) => {
    if (checked) {
      setBulkSelectedPersonnel((prev) => [...prev, person]);
    } else {
      setBulkSelectedPersonnel((prev) =>
        prev.filter((p) => p.id !== person.id)
      );
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset pagination when filters change
  const handleFiltersChange = (newFilters: FilterType) => {
    setFilters(newFilters);
    setCurrentPage(1);
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
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setImportModalOpen(true)}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button
            variant="outline"
            onClick={() => setExportModalOpen(true)}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            onClick={onAddPersonnel}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Personnel
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search personnel..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <PersonnelFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          activeFilterCount={activeFilterCount}
        />

        {(searchTerm || activeFilterCount > 0) && (
          <Badge variant="outline" className="text-gray-600">
            {sortedPersonnel.length} result
            {sortedPersonnel.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Bulk Operations */}
      <BulkOperations
        selectedPersonnel={bulkSelectedPersonnel}
        onSelectionChange={setBulkSelectedPersonnel}
        allPersonnel={paginatedPersonnel}
        onRefresh={refreshPersonnel}
      />

      {/* Personnel List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {sortedPersonnel.length === 0 ? (
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
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        bulkSelectedPersonnel.length ===
                          paginatedPersonnel.length &&
                        paginatedPersonnel.length > 0
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBulkSelectedPersonnel(paginatedPersonnel);
                        } else {
                          setBulkSelectedPersonnel([]);
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("first_name")}
                  >
                    <div className="flex items-center gap-1">
                      Name
                      {sortField === "first_name" && (
                        <span className="text-blue-600">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("rank")}
                  >
                    <div className="flex items-center gap-1">
                      Rank
                      {sortField === "rank" && (
                        <span className="text-blue-600">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("unit")}
                  >
                    <div className="flex items-center gap-1">
                      Unit
                      {sortField === "unit" && (
                        <span className="text-blue-600">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("email")}
                  >
                    <div className="flex items-center gap-1">
                      Email
                      {sortField === "email" && (
                        <span className="text-blue-600">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {sortField === "status" && (
                        <span className="text-blue-600">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedPersonnel.map((person) => (
                  <tr
                    key={person.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={bulkSelectedPersonnel.some(
                          (p) => p.id === person.id
                        )}
                        onChange={(e) =>
                          handleBulkSelection(person, e.target.checked)
                        }
                        className="rounded border-gray-300"
                      />
                    </td>
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

      {/* Pagination and Results */}
      {sortedPersonnel.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, sortedPersonnel.length)} of{" "}
              {sortedPersonnel.length} personnel
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Show:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600">per page</span>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
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

      {/* Export Modal */}
      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        personnel={personnel}
        selectedPersonnel={bulkSelectedPersonnel}
      />

      {/* Import Modal */}
      <ImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImportComplete={refreshPersonnel}
      />
    </div>
  );
}
