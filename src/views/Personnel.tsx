import { useState } from "react";
import AddPersonnelModal from "@/components/modals/AddPersonnelModal";
import ExcelImportPersonnelModal from "@/components/modals/ExcelImportPersonnelModal";
import PersonnelList from "@/components/PersonnelList";
import { CSVImportExport } from "@/components/CSVImportExport";
import { useAppData } from "@/hooks/useAppData";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/integrations/database";
import { Button } from "@/components/ui/button";
import { Plus, FileSpreadsheet } from "lucide-react";

type PersonnelImportResult = {
  successRows: number;
  errorRows: number;
  errors: string[];
};

const normalizeCsvKey = (key: string) =>
  key.toLowerCase().replace(/[^a-z0-9]+/g, "");

const getCsvValue = (row: any, keys: string[]) => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  const normalizedRow = Object.entries(row).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      acc[normalizeCsvKey(key)] = String(value ?? "").trim();
      return acc;
    },
    {}
  );

  for (const key of keys) {
    const value = normalizedRow[normalizeCsvKey(key)];
    if (value) return value;
  }

  return "";
};

const splitName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
};

const parseBoolean = (value: string) => {
  return ["true", "yes", "1", "y"].includes(value.trim().toLowerCase());
};

const parseContacts = (value: string) => {
  if (!value) return [];
  return value
    .split(/[;|]/)
    .map((contact) => contact.trim())
    .filter(Boolean);
};

const normalizeStatus = (value: string) => {
  const status = value.trim().toLowerCase();
  if (["active", "inactive", "suspended", "retired"].includes(status)) {
    return status as "active" | "inactive" | "suspended" | "retired";
  }
  return "active";
};

const defaultImportDepartment = "Headquaters";
const defaultImportGroup = "Administration Staff";

export default function Personnel() {
  const { refreshPersonnel, loading, personnel } = useAppData();
  const [showAddPersonnelModal, setShowAddPersonnelModal] = useState(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const handlePersonnelAdded = async () => {
    setIsRefreshing(true);
    await refreshPersonnel();
    setIsRefreshing(false);

    toast({
      title: "Personnel Added Successfully",
      description:
        "The new officer has been added to your team and is now visible in the list.",
      duration: 4000,
    });
  };

  const handleImportPersonnel = async (
    data: any[],
    options?: { department?: string; group?: string }
  ): Promise<PersonnelImportResult> => {
    setIsRefreshing(true);
    const errors: string[] = [];
    let successRows = 0;

    try {
      const existingPersonnel = await db.getPersonnel();
      const existingByContact = new Map<string, string>();
      const existingByFallbackValue = new Map<string, string>();

      const rememberExistingContact = (
        value: string | null | undefined,
        id: string
      ) => {
        if (value) existingByContact.set(value.toLowerCase(), id);
      };

      const rememberExistingFallback = (
        value: string | null | undefined,
        id: string
      ) => {
        if (value) existingByFallbackValue.set(value.toLowerCase(), id);
      };

      existingPersonnel.forEach((person) => {
        rememberExistingContact(person.phone, person.id);
        rememberExistingFallback(person.badge_number, person.id);
        rememberExistingFallback(person.pin_number, person.id);
        rememberExistingFallback(person.police_office_number, person.id);
        rememberExistingFallback(person.email, person.id);
      });

      for (let index = 0; index < data.length; index++) {
        const row = data[index];
        const rowNumber = index + 2;

        const fullName = getCsvValue(row, ["full_name", "Full Name", "name", "Name"]);
        const split = splitName(fullName);
        const firstName =
          getCsvValue(row, ["first_name", "First Name", "firstname"]) ||
          split.firstName;
        const lastName =
          getCsvValue(row, ["last_name", "Last Name", "lastname"]) ||
          split.lastName;
        const serviceNumber = getCsvValue(row, [
          "service_number",
          "Service Number",
          "Service No",
          "Service No.",
          "SN",
        ]);
        const pinNumber = getCsvValue(row, ["pin_number", "Pin Number", "PN"]);
        const policeOfficeNumber = getCsvValue(row, [
          "police_office_number",
          "Police Office Number",
          "PO",
        ]);
        const badgeNumber =
          getCsvValue(row, ["badge_number", "Badge Number", "Badge"]) ||
          serviceNumber ||
          pinNumber ||
          policeOfficeNumber;
        const rank = getCsvValue(row, ["rank", "Rank"]) || "Unknown";
        const contact = getCsvValue(row, ["phone", "Phone", "contact", "Contact"]);
        const unit =
          getCsvValue(row, [
            "unit",
            "Unit",
            "station_name",
            "Station Name",
            "Name of Station",
          ]) || "Unassigned";
        const importIdentifier =
          contact || badgeNumber || `IMPORT-${Date.now()}-${rowNumber}`;
        const importFirstName = firstName || "Unknown";
        const importLastName = lastName || `Personnel ${rowNumber}`;
        const email =
          getCsvValue(row, ["email", "Email"]) ||
          `${importIdentifier.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@personnel.local`;

        const childrenCount = getCsvValue(row, [
          "children_count",
          "Children Count",
        ]);
        const personnelData = {
          badge_number: importIdentifier,
          service_number: serviceNumber || undefined,
          pin_number: pinNumber || undefined,
          police_office_number: policeOfficeNumber || undefined,
          first_name: importFirstName,
          last_name: importLastName,
          email,
          phone: contact || undefined,
          gender: getCsvValue(row, ["gender", "Gender", "sex", "Sex"]) || undefined,
          rank,
          unit,
          department:
            options?.department ||
            getCsvValue(row, ["department", "Department"]) ||
            defaultImportDepartment,
          group:
            options?.group ||
            getCsvValue(row, ["group", "Group"]) ||
            defaultImportGroup,
          date_joined:
            getCsvValue(row, ["date_joined", "Date Joined", "Date to Station"]) ||
            new Date().toISOString().split("T")[0],
          emergency_contacts: parseContacts(
            getCsvValue(row, ["emergency_contacts", "Emergency Contacts"])
          ),
          marital_status:
            getCsvValue(row, ["marital_status", "Marital Status"]) || "Unknown",
          spouse: getCsvValue(row, ["spouse", "Spouse"]) || undefined,
          children_count: childrenCount ? parseInt(childrenCount, 10) || 0 : undefined,
          no_children: parseBoolean(getCsvValue(row, ["no_children", "No Children"])),
          status: normalizeStatus(getCsvValue(row, ["status", "Status"])),
          date_to_region: getCsvValue(row, ["date_to_region", "Date to Region"]) || null,
          date_to_station: getCsvValue(row, ["date_to_station", "Date to Station"]) || null,
          date_of_last_promotion:
            getCsvValue(row, [
              "date_of_last_promotion",
              "Date of Last Promotion",
              "Date of La",
              "Last Promotion",
              "Promotion Date",
            ]) ||
            null,
          remarks: getCsvValue(row, ["remarks", "Remarks", "Remarks/Status"]) || null,
        };

        try {
          const existingId =
            (contact && existingByContact.get(contact.toLowerCase())) ||
            (!contact && existingByFallbackValue.get(importIdentifier.toLowerCase())) ||
            (!contact && pinNumber && existingByFallbackValue.get(pinNumber.toLowerCase())) ||
            (policeOfficeNumber &&
              !contact &&
              existingByFallbackValue.get(policeOfficeNumber.toLowerCase())) ||
            (!contact && existingByFallbackValue.get(email.toLowerCase()));

          const savedPersonnel = existingId
            ? await db.updatePersonnel(existingId, personnelData)
            : await db.createPersonnel(personnelData);

          rememberExistingContact(savedPersonnel.phone, savedPersonnel.id);
          rememberExistingFallback(savedPersonnel.badge_number, savedPersonnel.id);
          rememberExistingFallback(savedPersonnel.pin_number, savedPersonnel.id);
          rememberExistingFallback(savedPersonnel.police_office_number, savedPersonnel.id);
          rememberExistingFallback(savedPersonnel.email, savedPersonnel.id);
          successRows++;
        } catch (error: any) {
          errors.push(
            `Row ${rowNumber} (${importIdentifier}): ${
              error?.message || "failed to create personnel"
            }`
          );
        }
      }

      await refreshPersonnel();

      toast({
        title: successRows > 0 ? "Import Complete" : "Import Failed",
        description: `${successRows} personnel record(s) imported${
          errors.length > 0 ? `, ${errors.length} failed` : ""
        }`,
        variant: successRows === 0 && errors.length > 0 ? "destructive" : "default",
        duration: 5000,
      });

      return {
        successRows,
        errorRows: errors.length,
        errors,
      };
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import personnel data",
        variant: "destructive",
      });

      return {
        successRows,
        errorRows: errors.length || 1,
        errors: errors.length
          ? errors
          : [error instanceof Error ? error.message : "Failed to import personnel data"],
      };
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportPersonnel = async () => {
    return personnel.map((p) => ({
      badge_number: p.badge_number,
      service_number: p.service_number || "",
      pin_number: p.pin_number || "",
      police_office_number: p.police_office_number || "",
      gender: p.gender || "",
      first_name: p.first_name,
      last_name: p.last_name,
      email: p.email,
      phone: p.phone || "",
      rank: p.rank,
      unit: p.unit,
      department: p.department || "",
      group: p.group || "",
      date_joined: p.date_joined,
      emergency_contacts: p.emergency_contacts.join("; "),
      marital_status: p.marital_status,
      spouse: p.spouse || "",
      children_count: p.children_count || 0,
      no_children: p.no_children || false,
      status: p.status,
      date_to_region: p.date_to_region || "",
      date_to_station: p.date_to_station || "",
      date_of_last_promotion: p.date_of_last_promotion || "",
      remarks: p.remarks || "",
      created_at: p.created_at,
    }));
  };

  const personnelImportTemplate = `Service Number,Gender,Rank,Name,Date to Region,Date to Station,Date of Last Promotion,Remarks/Status,Contact
SN001,Male,Constable,John Doe,2022-01-15,2023-06-01,2024-03-10,Good standing,+233123456789
SN002,Female,Sergeant,Mary Smith,2021-05-12,2023-02-20,2024-01-05,Active,+233234567890`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-lg text-gray-500">Loading personnel...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Personnel Management
          </h1>
          <p className="text-gray-600 mt-1">Manage officers and staff members</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowExcelImportModal(true)}
            className="gap-2 border-green-300 text-green-700 hover:bg-green-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Import Excel
          </Button>
          <CSVImportExport
            entityType="personnel"
            onImportComplete={handleImportPersonnel}
            onExportRequest={handleExportPersonnel}
            importTemplate={personnelImportTemplate}
          />
          <Button
            onClick={() => setShowAddPersonnelModal(true)}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Personnel
          </Button>
        </div>
      </div>

      <PersonnelList
        onAddPersonnel={() => setShowAddPersonnelModal(true)}
        showHeader={false}
      />

      <ExcelImportPersonnelModal
        open={showExcelImportModal}
        onOpenChange={setShowExcelImportModal}
        onImportComplete={handlePersonnelAdded}
      />

      <AddPersonnelModal
        open={showAddPersonnelModal}
        onOpenChange={setShowAddPersonnelModal}
        onPersonnelAdded={handlePersonnelAdded}
      />

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
