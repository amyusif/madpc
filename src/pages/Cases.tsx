import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

  // Filter cases based on search term
  const filteredCases = cases.filter(
    (caseItem) =>
      caseItem.case_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.case_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.case_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.reported_by.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-purple-100 text-purple-800";
      case "closed":
        return "bg-green-100 text-green-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
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

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cases..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Cases List */}
      {filteredCases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-16 h-16 text-muted-foreground/50 mb-6" />
            <h3 className="text-lg font-semibold mb-2">
              {cases.length === 0 ? "No Cases Found" : "No Search Results"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {cases.length === 0
                ? "Get started by logging your first case. Track investigations, assign officers, and monitor case status."
                : "Try adjusting your search terms to find what you're looking for."}
            </p>
            {/* No 'New Case' button here since modal is handled above */}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCases.map((caseItem) => (
            <Card
              key={caseItem.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  {/* Left side - Case info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">
                          {caseItem.case_number}
                        </h3>
                      </div>
                      <Badge className={getPriorityColor(caseItem.priority)}>
                        {caseItem.priority.charAt(0).toUpperCase() +
                          caseItem.priority.slice(1)}
                      </Badge>
                      <Badge className={getStatusColor(caseItem.status)}>
                        {caseItem.status === "in_progress"
                          ? "In Progress"
                          : caseItem.status.charAt(0).toUpperCase() +
                            caseItem.status.slice(1)}
                      </Badge>
                    </div>

                    <h4 className="text-base font-medium mb-2">
                      {caseItem.case_title}
                    </h4>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Type: {caseItem.case_type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>Reporter: {caseItem.reported_by}</span>
                      </div>
                      {caseItem.assigned_to && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>Assigned to: {caseItem.assigned_to}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Created:{" "}
                          {new Date(caseItem.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side - Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(caseItem)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
