import type { Personnel } from "@/integrations/supabase/client";

// CSV Export
export const exportToCSV = (
  personnel: Personnel[],
  filename: string = "personnel"
) => {
  const headers = [
    "Badge Number",
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Rank",
    "Unit",
    "Status",
    "Date Joined",
    "Marital Status",
    "Spouse",
    "Children Count",
    "Emergency Contacts",
    "Created At",
    "Updated At",
  ];

  const csvContent = [
    headers.join(","),
    ...personnel.map((person) =>
      [
        `"${person.badge_number}"`,
        `"${person.first_name}"`,
        `"${person.last_name}"`,
        `"${person.email}"`,
        `"${person.phone || ""}"`,
        `"${person.rank}"`,
        `"${person.unit}"`,
        `"${person.status}"`,
        `"${person.date_joined}"`,
        `"${person.marital_status}"`,
        `"${person.spouse || ""}"`,
        `"${person.children_count || ""}"`,
        `"${person.emergency_contacts.join("; ")}"`,
        `"${new Date(person.created_at).toLocaleString()}"`,
        `"${new Date(person.updated_at).toLocaleString()}"`,
      ].join(",")
    ),
  ].join("\n");

  downloadFile(csvContent, `${filename}.csv`, "text/csv");
};

// Excel Export (using CSV format with .xlsx extension for simplicity)
export const exportToExcel = (
  personnel: Personnel[],
  filename: string = "personnel"
) => {
  // For a more robust Excel export, you would use a library like xlsx
  // For now, we'll use CSV format which Excel can open
  const headers = [
    "Badge Number",
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Rank",
    "Unit",
    "Status",
    "Date Joined",
    "Marital Status",
    "Spouse",
    "Children Count",
    "Emergency Contacts",
    "Created At",
    "Updated At",
  ];

  const csvContent = [
    headers.join("\t"), // Use tabs for better Excel compatibility
    ...personnel.map((person) =>
      [
        person.badge_number,
        person.first_name,
        person.last_name,
        person.email,
        person.phone || "",
        person.rank,
        person.unit,
        person.status,
        person.date_joined,
        person.marital_status,
        person.spouse || "",
        person.children_count || "",
        person.emergency_contacts.join("; "),
        new Date(person.created_at).toLocaleString(),
        new Date(person.updated_at).toLocaleString(),
      ].join("\t")
    ),
  ].join("\n");

  downloadFile(
    csvContent,
    `${filename}.xlsx`,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
};

// PDF Export (basic HTML to PDF)
export const exportToPDF = (
  personnel: Personnel[],
  filename: string = "personnel"
) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Personnel Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; text-align: center; margin-bottom: 30px; }
        .header-info { text-align: center; margin-bottom: 20px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        th { background-color: #f2f2f2; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .status-active { color: #16a34a; font-weight: bold; }
        .status-inactive { color: #6b7280; font-weight: bold; }
        .status-suspended { color: #dc2626; font-weight: bold; }
        .status-retired { color: #2563eb; font-weight: bold; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 10px; }
      </style>
    </head>
    <body>
      <h1>Personnel Report</h1>
      <div class="header-info">
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>Total Personnel: ${personnel.length}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Badge</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Rank</th>
            <th>Unit</th>
            <th>Status</th>
            <th>Date Joined</th>
            <th>Marital Status</th>
          </tr>
        </thead>
        <tbody>
          ${personnel
            .map(
              (person) => `
            <tr>
              <td>${person.badge_number}</td>
              <td>${person.first_name} ${person.last_name}</td>
              <td>${person.email}</td>
              <td>${person.phone || "N/A"}</td>
              <td style="text-transform: capitalize;">${person.rank}</td>
              <td style="text-transform: capitalize;">${person.unit}</td>
              <td class="status-${
                person.status
              }" style="text-transform: capitalize;">${person.status}</td>
              <td>${new Date(person.date_joined).toLocaleDateString()}</td>
              <td>${person.marital_status}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
      
      <div class="footer">
        <p>This report contains confidential information. Handle with care.</p>
      </div>
    </body>
    </html>
  `;

  // Create a new window and print
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  }
};

// Summary Report Export
export const exportSummaryReport = (
  personnel: Personnel[],
  filename: string = "personnel-summary"
) => {
  const statusCounts = personnel.reduce((acc, person) => {
    acc[person.status] = (acc[person.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const rankCounts = personnel.reduce((acc, person) => {
    acc[person.rank] = (acc[person.rank] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const unitCounts = personnel.reduce((acc, person) => {
    acc[person.unit] = (acc[person.unit] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const summaryContent = `
Personnel Summary Report
Generated: ${new Date().toLocaleString()}
Total Personnel: ${personnel.length}

STATUS BREAKDOWN:
${Object.entries(statusCounts)
  .map(
    ([status, count]) =>
      `${status.charAt(0).toUpperCase() + status.slice(1)}: ${count} (${(
        (count / personnel.length) *
        100
      ).toFixed(1)}%)`
  )
  .join("\n")}

RANK BREAKDOWN:
${Object.entries(rankCounts)
  .map(
    ([rank, count]) =>
      `${rank.charAt(0).toUpperCase() + rank.slice(1)}: ${count} (${(
        (count / personnel.length) *
        100
      ).toFixed(1)}%)`
  )
  .join("\n")}

UNIT BREAKDOWN:
${Object.entries(unitCounts)
  .map(
    ([unit, count]) =>
      `${unit.charAt(0).toUpperCase() + unit.slice(1)}: ${count} (${(
        (count / personnel.length) *
        100
      ).toFixed(1)}%)`
  )
  .join("\n")}

RECENT ADDITIONS (Last 30 days):
${
  personnel.filter((person) => {
    const joinDate = new Date(person.date_joined);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return joinDate >= thirtyDaysAgo;
  }).length
} personnel

CONTACT INFORMATION COMPLETENESS:
Personnel with phone numbers: ${personnel.filter((p) => p.phone).length} (${(
    (personnel.filter((p) => p.phone).length / personnel.length) *
    100
  ).toFixed(1)}%)
Personnel with emergency contacts: ${
    personnel.filter((p) => p.emergency_contacts.length > 0).length
  } (${(
    (personnel.filter((p) => p.emergency_contacts.length > 0).length /
      personnel.length) *
    100
  ).toFixed(1)}%)
  `;

  downloadFile(summaryContent, `${filename}.txt`, "text/plain");
};

// Utility function to download files
const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Available export fields
export const EXPORT_FIELDS = [
  "Badge Number",
  "First Name",
  "Last Name",
  "Full Name",
  "Email",
  "Phone",
  "Rank",
  "Unit",
  "Status",
  "Date Joined",
  "Marital Status",
  "Spouse",
  "Children Count",
  "Emergency Contacts",
  "Created At",
  "Updated At",
];

// Custom export with selected fields
export const exportCustom = (
  personnel: Personnel[],
  selectedFields: string[],
  format: "csv" | "excel" | "pdf",
  filename: string = "personnel-custom"
) => {
  const fieldMapping: Record<string, keyof Personnel | string> = {
    "Badge Number": "badge_number",
    "First Name": "first_name",
    "Last Name": "last_name",
    "Full Name": "full_name", // Special case
    Email: "email",
    Phone: "phone",
    Rank: "rank",
    Unit: "unit",
    Status: "status",
    "Date Joined": "date_joined",
    "Marital Status": "marital_status",
    Spouse: "spouse",
    "Children Count": "children_count",
    "Emergency Contacts": "emergency_contacts",
    "Created At": "created_at",
    "Updated At": "updated_at",
  };

  const headers = selectedFields;
  const data = personnel.map((person) => {
    return selectedFields.map((field) => {
      const key = fieldMapping[field];
      if (key === "full_name") {
        return `${person.first_name} ${person.last_name}`;
      } else if (key === "emergency_contacts") {
        return person.emergency_contacts.join("; ");
      } else if (key === "created_at" || key === "updated_at") {
        return new Date(
          person[key as keyof Personnel] as string
        ).toLocaleString();
      } else {
        const value = person[key as keyof Personnel];
        return value || "";
      }
    });
  });

  if (format === "csv") {
    const csvContent = [
      headers.join(","),
      ...data.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");
    downloadFile(csvContent, `${filename}.csv`, "text/csv");
  } else if (format === "excel") {
    const csvContent = [
      headers.join("\t"),
      ...data.map((row) => row.join("\t")),
    ].join("\n");
    downloadFile(
      csvContent,
      `${filename}.xlsx`,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  }
};
