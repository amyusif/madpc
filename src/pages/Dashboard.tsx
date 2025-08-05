import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Calendar,
  AlertTriangle,
  Users,
  Plus,
  MessageSquare,
  RefreshCw,
  Eye,
  User,
  Clock,
} from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { personnel, cases, duties, error, refreshData, stats } = useAppData();
  const { toast } = useToast();

  // Get recent cases (last 5)
  const recentCases = cases.slice(0, 5);

  // Handle error display
  if (error) {
    toast({
      title: "Error",
      description: error,
      variant: "destructive",
    });
  }

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
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">Command center dashboard</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshData}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Personnel"
          value={stats.totalPersonnel.toString()}
          subtitle="Active officers"
          icon={Users}
          variant="blue"
        />
        <StatCard
          title="Active Cases"
          value={stats.activeCases.toString()}
          subtitle="Under investigation"
          icon={FileText}
          variant="green"
        />
        <StatCard
          title="Pending Duties"
          value={stats.pendingDuties.toString()}
          subtitle="Awaiting assignment"
          icon={Calendar}
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

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Cases */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Recent Cases
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshData}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentCases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  No cases found
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Get started by logging your first case.
                </p>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Case
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCases.map((caseItem) => (
                  <div
                    key={caseItem.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium truncate">
                          {caseItem.case_number}
                        </span>
                        <Badge
                          className={`text-xs ${getPriorityColor(
                            caseItem.priority
                          )}`}
                        >
                          {caseItem.priority.charAt(0).toUpperCase() +
                            caseItem.priority.slice(1)}
                        </Badge>
                        <Badge
                          className={`text-xs ${getStatusColor(
                            caseItem.status
                          )}`}
                        >
                          {caseItem.status === "in_progress"
                            ? "In Progress"
                            : caseItem.status.charAt(0).toUpperCase() +
                              caseItem.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mb-1">
                        {caseItem.case_title}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{caseItem.reported_by}</span>
                        </div>
                        {caseItem.assigned_to && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>
                              Assigned to:{" "}
                              {personnel.find(
                                (p) => p.id === caseItem.assigned_to
                              )?.first_name || "Unknown"}{" "}
                              {personnel.find(
                                (p) => p.id === caseItem.assigned_to
                              )?.last_name || ""}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(caseItem.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 ml-2"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* On Duty Personnel */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              On Duty Personnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm font-medium text-muted-foreground mb-2">
                No personnel currently on duty
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Assign duties to personnel to track their activities.
              </p>
              <Button size="sm" variant="outline" className="gap-2">
                <Calendar className="w-4 h-4" />
                Assign Duty
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Activity */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start gap-2" size="sm">
              <Plus className="w-4 h-4" />
              New Case
            </Button>
            <Button
              className="w-full justify-start gap-2"
              size="sm"
              variant="outline"
            >
              <Calendar className="w-4 h-4" />
              Assign Duty
            </Button>
            <Button
              className="w-full justify-start gap-2"
              size="sm"
              variant="destructive"
            >
              <AlertTriangle className="w-4 h-4" />
              Send Alert
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">System initialized</p>
                  <p className="text-xs text-muted-foreground">Just now</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Communication */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Communication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Communication features coming soon
              </p>
              <p className="text-xs text-muted-foreground">
                Send messages and circulars to personnel.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
