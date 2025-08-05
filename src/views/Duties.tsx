import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Calendar, User, Clock, MapPin } from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import { AssignDutyModal } from "@/components/modals/AssignDutyModal";

export default function Duties() {
  const { duties, personnel, refreshDuties } = useAppData();
  const [showAssignDutyModal, setShowAssignDutyModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { loading } = useAppData();

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

      {/* Duties List */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDuties.map((duty) => (
            <Card key={duty.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{duty.duty_type}</CardTitle>
                  <Badge className={getStatusColor(duty.status)}>
                    {duty.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>{duty.personnel_name}</span>
                </div>
                {duty.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{duty.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{new Date(duty.start_time).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {new Date(duty.start_time).toLocaleTimeString()} -{" "}
                    {duty.end_time
                      ? new Date(duty.end_time).toLocaleTimeString()
                      : "Ongoing"}
                  </span>
                </div>
                {duty.notes && (
                  <div className="text-sm text-muted-foreground">
                    <p className="line-clamp-2">{duty.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assign Duty Modal */}
      <AssignDutyModal
        open={showAssignDutyModal}
        onOpenChange={setShowAssignDutyModal}
        onDutyAssigned={refreshDuties}
      />
    </div>
  );
}
