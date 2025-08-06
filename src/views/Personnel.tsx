import { useState } from "react";
import AddPersonnelModal from "@/components/modals/AddPersonnelModal";
import PersonnelList from "@/components/PersonnelList";
import { PersonnelRefreshButton } from "@/components/RefreshIndicator";
import { useAppData } from "@/hooks/useAppData";
import { useToast } from "@/hooks/use-toast";

export default function Personnel() {
  const { refreshPersonnel, loading } = useAppData();
  const [showAddPersonnelModal, setShowAddPersonnelModal] = useState(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-lg text-gray-500">Loading personnel...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PersonnelList onAddPersonnel={() => setShowAddPersonnelModal(true)} />

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
