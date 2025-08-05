import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Users,
  Mail,
  Phone,
  Calendar,
  Shield,
  MapPin,
} from "lucide-react";
import AddPersonnelModal from "@/components/modals/AddPersonnelModal";
import { useAppData } from "@/hooks/useAppData";
import { useToast } from "@/hooks/use-toast";

export default function Personnel() {
  const { personnel, refreshPersonnel } = useAppData();
  const [showAddPersonnelModal, setShowAddPersonnelModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const handlePersonnelAdded = async () => {
    setIsRefreshing(true);
    await refreshPersonnel();
    setIsRefreshing(false);

    // Show a celebration toast
    toast({
      title: "🎉 Personnel Added Successfully!",
      description:
        "The new officer has been added to your team and is now visible in the list.",
      duration: 4000,
    });
  };
  const { loading } = useAppData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-lg text-gray-500">Loading personnel...</span>
      </div>
    );
  }

  // Filter personnel based on search term
  const filteredPersonnel = personnel.filter(
    (person) =>
      person.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.badge_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.rank.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.unit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      case "retired":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800">
            Personnel Management
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-muted-foreground">Manage officers and staff</p>
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-700 font-medium"
            >
              {personnel.length}{" "}
              {personnel.length === 1 ? "Officer" : "Officers"}
            </Badge>
          </div>
        </div>
        <Button
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
          onClick={() => setShowAddPersonnelModal(true)}
        >
          <Plus className="w-4 h-4" />
          Add Personnel
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, badge, rank, or unit..."
            className="pl-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white shadow-sm"
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
      {filteredPersonnel.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-16 h-16 text-muted-foreground/50 mb-6" />
            <h3 className="text-lg font-semibold mb-2">
              {personnel.length === 0
                ? "No Personnel Found"
                : "No Search Results"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {personnel.length === 0
                ? "Get started by adding your first personnel. You can manage officers, assign ranks, and track their duty history."
                : "Try adjusting your search terms to find what you're looking for."}
            </p>
            {personnel.length === 0 && (
              <Button
                className="gap-2"
                onClick={() => setShowAddPersonnelModal(true)}
              >
                <Plus className="w-4 h-4" />
                Add Personnel
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPersonnel.map((person, index) => (
            <Card
              key={person.id}
              className="hover:shadow-lg hover:scale-[1.02] transition-all duration-300 border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-blue-50/30"
              style={{
                animationDelay: `${index * 100}ms`,
                animation: "fadeInUp 0.6s ease-out forwards",
              }}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-800">
                        {person.first_name} {person.last_name}
                      </CardTitle>
                      <p className="text-sm text-blue-600 font-medium">
                        Badge: {person.badge_number}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={`${getStatusColor(
                      person.status
                    )} font-medium px-3 py-1`}
                  >
                    {person.status.charAt(0).toUpperCase() +
                      person.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm bg-gray-50 p-3 rounded-lg">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-700 truncate">{person.email}</span>
                </div>
                {person.phone && (
                  <div className="flex items-center gap-3 text-sm bg-gray-50 p-3 rounded-lg">
                    <Phone className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700">{person.phone}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm bg-blue-50 p-2 rounded-lg">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-500">Rank</p>
                      <p className="font-medium text-gray-800 capitalize">
                        {person.rank}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm bg-purple-50 p-2 rounded-lg">
                    <MapPin className="w-4 h-4 text-purple-500" />
                    <div>
                      <p className="text-xs text-gray-500">Unit</p>
                      <p className="font-medium text-gray-800 capitalize">
                        {person.unit}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm bg-green-50 p-3 rounded-lg">
                  <Calendar className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-xs text-gray-500">Date Joined</p>
                    <p className="font-medium text-gray-800">
                      {new Date(person.date_joined).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Personnel Modal */}
      <AddPersonnelModal
        open={showAddPersonnelModal}
        onOpenChange={setShowAddPersonnelModal}
        onPersonnelAdded={handlePersonnelAdded}
      />

      {/* Loading overlay when refreshing */}
      {isRefreshing && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-xl flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-700 font-medium">
              Updating personnel list...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
