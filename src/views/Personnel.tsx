import { useState } from "react";
import AddPersonnelModal from "@/components/modals/AddPersonnelModal";
import PersonnelList from "@/components/PersonnelList";
import { PersonnelRefreshButton } from "@/components/RefreshIndicator";
import { CSVImportExport } from "@/components/CSVImportExport";
import { useAppData } from "@/hooks/useAppData";
import { useToast } from "@/hooks/use-toast";
import { supabaseHelpers } from "@/integrations/supabase/client";

export default function Personnel() {
  const { refreshPersonnel, loading, personnel } = useAppData();
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

  const handleImportPersonnel = async (data: any[]) => {
    setIsRefreshing(true);
    try {
      for (const row of data) {
        // Map CSV data to personnel format
        const personnelData = {
          badge_number: row.badge_number || row.Badge || "",
          first_name: row.first_name || row["First Name"] || "",
          last_name: row.last_name || row["Last Name"] || "",
          email: row.email || row.Email || "",
          phone: row.phone || row.Phone || null,
          rank: row.rank || row.Rank || "",
          unit: row.unit || row.Unit || "",
          date_joined:
            row.date_joined ||
            row["Date Joined"] ||
            new Date().toISOString().split("T")[0],
          emergency_contacts: row.emergency_contacts
            ? [row.emergency_contacts]
            : [],
          marital_status:
            row.marital_status || row["Marital Status"] || "single",
          spouse: row.spouse || row.Spouse || null,
          children_count: row.children_count ? parseInt(row.children_count) : 0,
          no_children: row.no_children === "true" || row.no_children === true,
          status: (row.status || row.Status || "active") as
            | "active"
            | "inactive"
            | "suspended"
            | "retired",
        };

        await supabaseHelpers.createPersonnel(personnelData);
      }

      await refreshPersonnel();

      toast({
        title: "✅ Import Successful",
        description: `Successfully imported ${data.length} personnel records`,
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import personnel data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportPersonnel = async () => {
    return personnel.map((p) => ({
      badge_number: p.badge_number,
      first_name: p.first_name,
      last_name: p.last_name,
      email: p.email,
      phone: p.phone || "",
      rank: p.rank,
      unit: p.unit,
      date_joined: p.date_joined,
      emergency_contacts: p.emergency_contacts.join("; "),
      marital_status: p.marital_status,
      spouse: p.spouse || "",
      children_count: p.children_count || 0,
      no_children: p.no_children || false,
      status: p.status,
      created_at: p.created_at,
    }));
  };

  const personnelImportTemplate = `badge_number,first_name,last_name,email,phone,rank,unit,date_joined,emergency_contacts,marital_status,spouse,children_count,no_children,status
P001,John,Doe,john.doe@police.gov,+233123456789,Constable,Patrol,2024-01-15,Jane Doe - +233987654321,married,Jane Doe,2,false,active
P002,Mary,Smith,mary.smith@police.gov,+233234567890,Sergeant,Investigation,2023-06-10,Bob Smith - +233876543210,married,Bob Smith,1,false,active`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-lg text-gray-500">Loading personnel...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Import/Export Section */}
      <div className="flex justify-end">
        <CSVImportExport
          entityType="personnel"
          onImportComplete={handleImportPersonnel}
          onExportRequest={handleExportPersonnel}
          importTemplate={personnelImportTemplate}
        />
      </div>

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
