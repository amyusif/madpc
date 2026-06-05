"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ShieldAlert,
  Search,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  FileText,
  ChevronDown,
  ChevronUp,
  User,
  Gavel,
  Calendar,
  Paperclip,
  ExternalLink,
  Filter,
} from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/integrations/database";
import type { Convict, Case, CaseReport } from "@/integrations/database";
import AddConvictModal from "@/components/modals/AddConvictModal";
import EditConvictModal from "@/components/modals/EditConvictModal";
import AddCaseReportModal from "@/components/modals/AddCaseReportModal";

type Tab = "registry" | "case-reports";

const STATUS_COLORS: Record<string, string> = {
  imprisoned: "bg-red-100 text-red-800 border-red-200",
  released: "bg-green-100 text-green-800 border-green-200",
  deceased: "bg-gray-100 text-gray-700 border-gray-200",
  escaped: "bg-orange-100 text-orange-800 border-orange-200",
};

const STATUS_DOT: Record<string, string> = {
  imprisoned: "bg-red-500",
  released: "bg-green-500",
  deceased: "bg-gray-400",
  escaped: "bg-orange-500",
};

export default function ConvictDB() {
  const { cases, convicts, refreshConvicts } = useAppData();
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>("registry");

  // Convict Registry state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedConvict, setSelectedConvict] = useState<Convict | null>(null);
  const [deleteConvict, setDeleteConvict] = useState<Convict | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Case Reports state
  const [reportSearch, setReportSearch] = useState("");
  const [caseReports, setCaseReports] = useState<Record<string, CaseReport[]>>({});
  const [loadingReports, setLoadingReports] = useState<Record<string, boolean>>({});
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCase, setReportCase] = useState<Case | null>(null);

  const fetchReportsForCase = useCallback(async (caseId: string) => {
    if (caseReports[caseId]) return;
    setLoadingReports((prev) => ({ ...prev, [caseId]: true }));
    try {
      const reports = await db.getCaseReports(caseId);
      setCaseReports((prev) => ({ ...prev, [caseId]: reports }));
    } catch {
      setCaseReports((prev) => ({ ...prev, [caseId]: [] }));
    } finally {
      setLoadingReports((prev) => ({ ...prev, [caseId]: false }));
    }
  }, [caseReports]);

  const handleToggleCase = (caseId: string) => {
    if (expandedCaseId === caseId) {
      setExpandedCaseId(null);
    } else {
      setExpandedCaseId(caseId);
      fetchReportsForCase(caseId);
    }
  };

  const handleDeleteConvict = async () => {
    if (!deleteConvict) return;
    setDeletingId(deleteConvict.id);
    try {
      await db.deleteConvict(deleteConvict.id);
      toast({ title: "Convict removed", description: `${deleteConvict.full_name} has been removed from the registry.` });
      await refreshConvicts();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
      setDeleteConvict(null);
    }
  };

  const handleDeleteReport = async (reportId: string, caseId: string) => {
    try {
      await db.deleteCaseReport(reportId);
      setCaseReports((prev) => ({
        ...prev,
        [caseId]: (prev[caseId] || []).filter((r) => r.id !== reportId),
      }));
      toast({ title: "Report deleted" });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  const afterReportAdded = async () => {
    if (expandedCaseId) {
      setCaseReports((prev) => {
        const next = { ...prev };
        delete next[expandedCaseId];
        return next;
      });
      await fetchReportsForCase(expandedCaseId);
    }
  };

  const filteredConvicts = convicts.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      c.full_name.toLowerCase().includes(q) ||
      (c.alias || "").toLowerCase().includes(q) ||
      c.crime_type.toLowerCase().includes(q) ||
      (c.case_number || "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredCases = cases.filter((c) => {
    const q = reportSearch.toLowerCase();
    return (
      c.case_number.toLowerCase().includes(q) ||
      c.case_title.toLowerCase().includes(q) ||
      c.case_type.toLowerCase().includes(q)
    );
  });

  const fmt = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const imprisonedCount = convicts.filter((c) => c.status === "imprisoned").length;
  const releasedCount = convicts.filter((c) => c.status === "released").length;
  const escapedCount = convicts.filter((c) => c.status === "escaped").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Convict DB</h1>
            <p className="text-muted-foreground text-sm">
              Criminal records, court rulings and evidence directory
            </p>
          </div>
        </div>
        {activeTab === "registry" && (
          <Button className="gap-2 bg-red-600 hover:bg-red-700 text-white" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Add Convict
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Convicts", value: convicts.length, color: "text-gray-900", bg: "bg-gray-50" },
          { label: "Imprisoned", value: imprisonedCount, color: "text-red-700", bg: "bg-red-50" },
          { label: "Released", value: releasedCount, color: "text-green-700", bg: "bg-green-50" },
          { label: "Escaped", value: escapedCount, color: "text-orange-700", bg: "bg-orange-50" },
        ].map((s) => (
          <Card key={s.label} className={`${s.bg} border-0 shadow-sm`}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { key: "registry", label: "Convict Registry", icon: User },
          { key: "case-reports", label: "Case Reports & Evidence", icon: FileText },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as Tab)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === key
                ? "border-red-600 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ===== CONVICT REGISTRY TAB ===== */}
      {activeTab === "registry" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, crime, case #..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="imprisoned">Imprisoned</SelectItem>
                  <SelectItem value="released">Released</SelectItem>
                  <SelectItem value="deceased">Deceased</SelectItem>
                  <SelectItem value="escaped">Escaped</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Convict Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {filteredConvicts.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {convicts.length === 0 ? "No Convicts Recorded" : "No Results Found"}
                </h3>
                <p className="text-gray-500 mb-6">
                  {convicts.length === 0
                    ? "Add your first convict record to get started."
                    : "Try adjusting your search or filter."}
                </p>
                {convicts.length === 0 && (
                  <Button onClick={() => setShowAddModal(true)} className="gap-2 bg-red-600 hover:bg-red-700 text-white">
                    <Plus className="w-4 h-4" />
                    Add Convict
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-14 font-semibold text-gray-700">Photo</TableHead>
                    <TableHead className="font-semibold text-gray-700">Name</TableHead>
                    <TableHead className="font-semibold text-gray-700">Case #</TableHead>
                    <TableHead className="font-semibold text-gray-700">Crime</TableHead>
                    <TableHead className="font-semibold text-gray-700">Sentence</TableHead>
                    <TableHead className="font-semibold text-gray-700">Date In</TableHead>
                    <TableHead className="font-semibold text-gray-700">Date Out</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConvicts.map((convict) => (
                    <TableRow key={convict.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="w-10 h-12 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                          {convict.photo_url ? (
                            <img
                              src={convict.photo_url}
                              alt={convict.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-gray-900">{convict.full_name}</div>
                        {convict.alias && (
                          <div className="text-xs text-gray-500 italic">&quot;{convict.alias}&quot;</div>
                        )}
                        {convict.nationality && (
                          <div className="text-xs text-gray-400">{convict.nationality}</div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-blue-600">
                        {convict.case_number || "—"}
                      </TableCell>
                      <TableCell className="text-gray-700">{convict.crime_type}</TableCell>
                      <TableCell className="text-gray-700 max-w-[180px] truncate" title={convict.sentence}>
                        {convict.sentence}
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">{fmt(convict.date_in)}</TableCell>
                      <TableCell className="text-gray-600 text-sm">{fmt(convict.date_out)}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[convict.status]}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[convict.status]}`} />
                          {convict.status.charAt(0).toUpperCase() + convict.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedConvict(convict);
                                setShowEditModal(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setDeleteConvict(convict)}
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
        </div>
      )}

      {/* ===== CASE REPORTS TAB ===== */}
      {activeTab === "case-reports" && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cases..."
              className="pl-9"
              value={reportSearch}
              onChange={(e) => setReportSearch(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {filteredCases.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-lg border border-gray-200">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No cases found.</p>
              </div>
            ) : (
              filteredCases.map((caseItem) => {
                const isOpen = expandedCaseId === caseItem.id;
                const reports = caseReports[caseItem.id] || [];
                const isLoading = loadingReports[caseItem.id];

                return (
                  <div
                    key={caseItem.id}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                  >
                    {/* Case Row */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleToggleCase(caseItem.id)}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <Gavel className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm font-semibold text-blue-600">
                              {caseItem.case_number}
                            </span>
                            <span className="text-gray-400 text-xs">{caseItem.case_type}</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                caseItem.status === "open"
                                  ? "bg-blue-100 text-blue-700"
                                  : caseItem.status === "in_progress"
                                  ? "bg-purple-100 text-purple-700"
                                  : caseItem.status === "closed"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {caseItem.status.replace("_", " ")}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 font-medium mt-0.5 truncate">{caseItem.case_title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {isOpen && (
                          <Button
                            size="sm"
                            className="gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReportCase(caseItem);
                              setShowReportModal(true);
                            }}
                          >
                            <Plus className="w-3 h-3" />
                            Add Report
                          </Button>
                        )}
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Reports Panel */}
                    {isOpen && (
                      <div className="border-t border-gray-100 bg-gray-50 p-4">
                        {isLoading ? (
                          <p className="text-sm text-gray-400 animate-pulse text-center py-4">Loading reports...</p>
                        ) : reports.length === 0 ? (
                          <div className="text-center py-6">
                            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No reports logged yet for this case.</p>
                            <Button
                              size="sm"
                              className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white gap-1"
                              onClick={() => {
                                setReportCase(caseItem);
                                setShowReportModal(true);
                              }}
                            >
                              <Plus className="w-3 h-3" />
                              Add First Report
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {reports.map((report) => (
                              <div
                                key={report.id}
                                className="bg-white rounded-lg border border-gray-200 p-4"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0 space-y-2">
                                    {(report.court_ruling || report.court_date || report.presiding_judge) && (
                                      <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                                        {report.court_date && (
                                          <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {fmt(report.court_date)}
                                          </span>
                                        )}
                                        {report.presiding_judge && (
                                          <span className="flex items-center gap-1">
                                            <Gavel className="w-3 h-3" />
                                            {report.presiding_judge}
                                          </span>
                                        )}
                                        {report.created_by && (
                                          <span className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            {report.created_by}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    {report.court_ruling && (
                                      <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-0.5">Ruling</p>
                                        <p className="text-sm text-amber-900">{report.court_ruling}</p>
                                      </div>
                                    )}
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.report_text}</p>

                                    {report.evidence_urls.length > 0 && (
                                      <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                          <Paperclip className="w-3 h-3" />
                                          Evidence ({report.evidence_urls.length})
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                          {report.evidence_urls.map((url, i) => (
                                            <a
                                              key={i}
                                              href={url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-1 text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded"
                                            >
                                              <ExternalLink className="w-3 h-3" />
                                              {url.split("/").pop() || `File ${i + 1}`}
                                            </a>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleDeleteReport(report.id, caseItem.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-3">
                                  Logged {new Date(report.created_at).toLocaleString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <AddConvictModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onConvictAdded={refreshConvicts}
      />

      <EditConvictModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        convict={selectedConvict}
        onConvictUpdated={refreshConvicts}
      />

      <AddCaseReportModal
        open={showReportModal}
        onOpenChange={setShowReportModal}
        caseItem={reportCase}
        onReportAdded={afterReportAdded}
        createdBy={user?.username}
      />

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteConvict} onOpenChange={(o) => !o && setDeleteConvict(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Convict Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteConvict?.full_name}</strong> from the Convict DB.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteConvict}
              disabled={!!deletingId}
            >
              {deletingId ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
