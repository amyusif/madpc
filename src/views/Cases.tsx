import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  FileText,
  Trash2,
  Edit,
  Eye,
  Calendar,
  User,
  AlertTriangle,
  MoreHorizontal,
  Filter,
} from "lucide-react";
import AddCaseModal from "@/components/modals/AddCaseModal";
import DeleteCaseModal from "@/components/modals/DeleteCaseModal";
import { useAppData } from "@/hooks/useAppData";
import { useToast } from "@/hooks/use-toast";
export default function Cases() {
  const { cases, refreshCases, loading } = useAppData();
  const [showAddCaseModal, setShowAddCaseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<{
    id: string;
    case_number: string;
    case_title: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const { toast } = useToast();

  // Handle delete case click
  const handleDeleteClick = (caseItem: any) => {
    setCaseToDelete({
      id: caseItem.id,
      case_number: caseItem.case_number,
      case_title: caseItem.case_title,
    });
    setShowDeleteModal(true);
  };

  // Filter cases based on search term, status, and priority
  const filteredCases = cases.filter((caseItem) => {
    const matchesSearch =
      caseItem.case_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.case_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.case_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.reported_by.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || caseItem.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || caseItem.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-lg text-gray-500">Loading cases...</span>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-500 text-white";
      case "in_progress":
        return "bg-purple-500 text-white";
      case "closed":
        return "bg-orange-500 text-white";
      case "archived":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "open":
        return "Open";
      case "in_progress":
        return "In progress";
      case "closed":
        return "Closed";
      case "archived":
        return "Resolved";
      default:
        return status;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Case Management</h1>
          <p className="text-muted-foreground">
            Track and manage investigation cases
          </p>
        </div>
        <Button
          type="button"
          className="gap-2"
          onClick={() => setShowAddCaseModal(true)}
        >
          <Plus className="w-4 h-4" />
          Add Case
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Tickets"
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="archived">Resolved</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredCases.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {cases.length === 0 ? "No Cases Found" : "No Search Results"}
            </h3>
            <p className="text-gray-600 mb-6">
              {cases.length === 0
                ? "Get started by logging your first case. Track investigations, assign officers, and monitor case status."
                : "Try adjusting your search terms or filters."}
            </p>
            {cases.length === 0 && (
              <Button
                onClick={() => setShowAddCaseModal(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Case
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[100px] font-semibold text-gray-700">
                  ID
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Priority
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Assignee
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Description
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Status
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Requested by
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Created on
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Completion Date
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.map((caseItem) => (
                <TableRow key={caseItem.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-blue-600">
                    {caseItem.case_number}
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(caseItem.priority)}>
                      {caseItem.priority.charAt(0).toUpperCase() +
                        caseItem.priority.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-900">
                    {caseItem.assigned_to || "Assignee Name"}
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <div className="text-gray-900 font-medium">
                      {caseItem.case_title}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {caseItem.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className={`${getStatusColor(
                            caseItem.status
                          )} hover:opacity-80 px-3 py-1 rounded-md text-sm font-medium`}
                        >
                          {getStatusText(caseItem.status)}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>Open</DropdownMenuItem>
                        <DropdownMenuItem>In progress</DropdownMenuItem>
                        <DropdownMenuItem>Resolved</DropdownMenuItem>
                        <DropdownMenuItem>Closed</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="text-gray-900">
                    {caseItem.reported_by}
                  </TableCell>
                  <TableCell className="text-gray-900">
                    {new Date(caseItem.created_at).toLocaleDateString("en-US", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-gray-900">
                    {caseItem.status === "closed" ||
                    caseItem.status === "archived"
                      ? new Date(caseItem.updated_at).toLocaleDateString(
                          "en-US",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )
                      : "-"}
                  </TableCell>
                  <TableCell>
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
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteClick(caseItem)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <AddCaseModal
        open={showAddCaseModal}
        onOpenChange={setShowAddCaseModal}
        onCaseAdded={refreshCases}
      />

      {/* Delete Case Modal */}
      <DeleteCaseModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        caseData={caseToDelete}
      />
    </div>
  );
}
