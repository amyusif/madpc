import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Download,
  FileText,
  Users,
  Calendar,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Shield,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppData } from "@/hooks/useAppData";

export default function Reports() {
  const {
    personnel,
    cases,
    duties,
    loading: dataLoading,
    error: dataError,
  } = useAppData();
  const { toast } = useToast();
  const [resolvedCases, setResolvedCases] = useState<any[]>([]);

  const [stats, setStats] = useState({
    totalPersonnel: 0,
    casesResolved: 0,
    pendingDuties: 0,
    activeAlerts: 0,
  });

  // Handle Supabase connection error
  useEffect(() => {
    if (dataError) {
      console.error("Supabase error:", dataError);
      toast({
        title: "🔌 Connection Issue",
        description:
          dataError.includes("offline") || dataError.includes("network")
            ? "You're currently offline. Some data may not be available."
            : "Failed to load data from server. Please check your connection.",
        variant: "destructive",
        duration: 6000,
      });
    }
  }, [dataError, toast]);

  // Calculate stats from app data with error handling
  useEffect(() => {
    try {
      const totalPersonnel =
        personnel?.filter((p) => p.status === "active")?.length || 0;
      const casesResolved =
        cases?.filter((c) => c.status === "closed" || c.status === "archived")
          ?.length || 0;
      const pendingDuties =
        duties?.filter((d) => d.status === "assigned")?.length || 0;

      setStats({
        totalPersonnel,
        casesResolved,
        pendingDuties,
        activeAlerts: 0, // Placeholder for alerts
      });

      // Set resolved cases with safety check
      const resolvedCasesList =
        cases?.filter(
          (c) => c.status === "closed" || c.status === "archived"
        ) || [];
      setResolvedCases(resolvedCasesList);
    } catch (error) {
      console.error("Error calculating stats:", error);
      // Set default values if there's an error
      setStats({
        totalPersonnel: 0,
        casesResolved: 0,
        pendingDuties: 0,
        activeAlerts: 0,
      });
      setResolvedCases([]);
    }
  }, [personnel, cases, duties]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "closed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "archived":
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "closed":
        return "bg-green-100 text-green-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <span className="text-lg text-gray-500">Loading reports data...</span>
        </div>
      </div>
    );
  }

  // Show offline message if there's a connection error
  if (dataError && personnel.length === 0 && cases.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-800">
              Reports & Analytics
            </h1>
            <p className="text-muted-foreground">
              Generate and analyze operational reports
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="w-16 h-16 text-orange-500 mb-6" />
            <h3 className="text-lg font-semibold mb-2 text-gray-800">
              Connection Issue
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {dataError.includes("offline")
                ? "You're currently offline. Please check your internet connection to view reports."
                : "Unable to load data from the server. Please check your connection and try again."}
            </p>
            <Button onClick={() => window.location.reload()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Generate and analyze operational reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Generate Report
          </Button>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Personnel"
          value={stats.totalPersonnel.toString()}
          subtitle="Active officers"
          icon={Users}
          variant="blue"
        />
        <StatCard
          title="Cases Resolved"
          value={stats.casesResolved.toString()}
          subtitle="Closed & archived"
          icon={CheckCircle}
          variant="green"
        />
        <StatCard
          title="Pending Duties"
          value={stats.pendingDuties.toString()}
          subtitle="Awaiting assignment"
          icon={Clock}
          variant="orange"
        />
        <StatCard
          title="Active Alerts"
          value={stats.activeAlerts.toString()}
          subtitle="Urgent attention"
          icon={AlertTriangle}
          variant="red"
        />
      </div>

      {/* Report Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Report Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Report Type</label>
            <Select defaultValue="overview">
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="personnel">Personnel</SelectItem>
                <SelectItem value="cases">Cases</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <Select defaultValue="month">
              <SelectTrigger>
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Format</label>
            <Select defaultValue="pdf">
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="personnel">Personnel</TabsTrigger>
          <TabsTrigger value="cases">Cases</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cases by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">Resolved</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      {stats.casesResolved}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">Active</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">
                      {
                        cases.filter(
                          (c) =>
                            c.status === "open" || c.status === "in_progress"
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Personnel Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">
                        Active Officers
                      </span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">
                      {stats.totalPersonnel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium">On Duty</span>
                    </div>
                    <span className="text-lg font-bold text-orange-600">
                      {stats.pendingDuties}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="personnel">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personnel Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Shield className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.totalPersonnel}
                    </div>
                    <div className="text-sm text-blue-600">Active Officers</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold text-green-600">
                      {personnel.filter((p) => p.status === "active").length}
                    </div>
                    <div className="text-sm text-green-600">On Active Duty</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                    <div className="text-2xl font-bold text-orange-600">
                      {personnel.filter((p) => p.status === "inactive").length}
                    </div>
                    <div className="text-sm text-orange-600">Off Duty</div>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <Button className="gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Generate Personnel Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cases">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Resolved Cases Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {resolvedCases.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      No resolved cases found
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cases will appear here once they are closed or archived.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {resolvedCases.slice(0, 5).map((caseItem) => (
                      <div
                        key={caseItem.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusIcon(caseItem.status)}
                            <span className="text-sm font-medium truncate">
                              {caseItem.case_number || "N/A"}
                            </span>
                            <Badge
                              className={`text-xs ${getStatusColor(
                                caseItem.status
                              )}`}
                            >
                              {caseItem.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate mb-1">
                            {caseItem.case_title || "No title"}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              Reporter: {caseItem.reported_by || "Unknown"}
                            </span>
                            <span>
                              Resolved:{" "}
                              {new Date(
                                caseItem.updated_at || Date.now()
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Case Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.casesResolved}
                    </div>
                    <div className="text-sm text-green-600">Resolved</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {
                        cases.filter(
                          (c) =>
                            c.status === "open" || c.status === "in_progress"
                        ).length
                      }
                    </div>
                    <div className="text-sm text-blue-600">Active</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {cases.filter((c) => c.status === "in_progress").length}
                    </div>
                    <div className="text-sm text-orange-600">In Progress</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">
                      {cases.length}
                    </div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Operations Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                    <h3 className="text-lg font-semibold mb-2 text-blue-800">
                      Duty Efficiency
                    </h3>
                    <p className="text-sm text-blue-600 mb-4">
                      Track duty completion rates and operational efficiency
                      metrics.
                    </p>
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {stats.pendingDuties}
                    </div>
                    <div className="text-sm text-blue-600">Active Duties</div>
                  </div>

                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <Users className="w-12 h-12 mx-auto mb-4 text-green-600" />
                    <h3 className="text-lg font-semibold mb-2 text-green-800">
                      Resource Utilization
                    </h3>
                    <p className="text-sm text-green-600 mb-4">
                      Monitor personnel allocation and resource distribution.
                    </p>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {Math.round(
                        (stats.pendingDuties /
                          Math.max(stats.totalPersonnel, 1)) *
                          100
                      )}
                      %
                    </div>
                    <div className="text-sm text-green-600">
                      Utilization Rate
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button className="gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Generate Operations Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
