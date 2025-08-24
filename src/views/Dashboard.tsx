import { useState, useEffect } from "react";
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
  Mail,
  MessageCircle,
  FileCheck,
  MapPin,
  Shield,
} from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import { useToast } from "@/hooks/use-toast";
import { Loading } from "@/components/ui/loading";
import AddCaseModal from "@/components/modals/AddCaseModal";
import { AssignDutyModal } from "@/components/modals/AssignDutyModal";
import SendMessageModal from "@/components/modals/SendMessageAlertModal";
import SendCircularModal from "@/components/modals/SendCircularModal";

export default function Dashboard() {
  const { personnel, cases, duties, error, refreshData, stats, loading } =
    useAppData();
  const { toast } = useToast();

  // Modal states
  const [showAddCaseModal, setShowAddCaseModal] = useState(false);
  const [showAddDutyModal, setShowAddDutyModal] = useState(false);
  const [showSendMessageModal, setShowSendMessageModal] = useState(false);
  const [showSendCircularModal, setShowSendCircularModal] = useState(false);

  // Communication data
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [recentCirculars, setRecentCirculars] = useState<any[]>([]);
  const [communicationLoading, setCommunicationLoading] = useState(false);

  // Get recent cases (last 5)
  const recentCases = cases.slice(0, 5);

  // Get active duties with assigned personnel
  const activeDuties = duties.filter(duty => duty.status === "assigned" || duty.status === "in_progress").slice(0, 5);

  // Load recent communications
  const loadRecentCommunications = async () => {
    setCommunicationLoading(true);
    try {
      // Load recent messages
      const messagesRes = await fetch("/api/messages");
      if (messagesRes.ok) {
        const messagesData = await messagesRes.json();
        setRecentMessages((messagesData.messages || []).slice(0, 3));
      }

      // Load recent circulars
      const circularsRes = await fetch("/api/circulars");
      if (circularsRes.ok) {
        const circularsData = await circularsRes.json();
        setRecentCirculars((circularsData.circulars || []).slice(0, 3));
      }
    } catch (error) {
      console.error("Failed to load communications:", error);
    } finally {
      setCommunicationLoading(false);
    }
  };

  useEffect(() => {
    loadRecentCommunications();
  }, []);

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
        {loading ? (
          // Loading skeleton for stats
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
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
          </>
        )}
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
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => setShowAddCaseModal(true)}
                >
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
            {activeDuties.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  No personnel currently on duty
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Assign duties to personnel to track their activities.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => setShowAddDutyModal(true)}
                >
                  <Calendar className="w-4 h-4" />
                  Assign Duty
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeDuties.map((duty) => {
                  const assignedPersonnel = personnel.find(p => p.id === duty.personnel_id);
                  return (
                    <div
                      key={duty.id}
                      className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0" />
                          <div>
                            <span className="text-sm font-semibold text-gray-900">
                              {duty.duty_type}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className="text-xs bg-blue-100 text-blue-800">
                                {duty.status}
                              </Badge>
                              <Badge className="text-xs bg-green-100 text-green-800">
                                Active
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {duty.description}
                      </p>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          {assignedPersonnel && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>
                                {assignedPersonnel.first_name} {assignedPersonnel.last_name}
                              </span>
                            </div>
                          )}
                          {duty.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{duty.location}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(duty.start_time).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => setShowAddDutyModal(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Assign New Duty
                  </Button>
                </div>
              </div>
            )}
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
            <Button
              className="w-full justify-start gap-2"
              size="sm"
              onClick={() => setShowAddCaseModal(true)}
            >
              <Plus className="w-4 h-4" />
              New Case
            </Button>
            <Button
              className="w-full justify-start gap-2"
              size="sm"
              variant="outline"
              onClick={() => setShowAddDutyModal(true)}
            >
              <Calendar className="w-4 h-4" />
              Assign Duty
            </Button>
            <Button
              className="w-full justify-start gap-2"
              size="sm"
              variant="outline"
              onClick={() => setShowSendMessageModal(true)}
            >
              <MessageSquare className="w-4 h-4" />
              Send Message
            </Button>
            <Button
              className="w-full justify-start gap-2"
              size="sm"
              variant="outline"
              onClick={() => setShowSendCircularModal(true)}
            >
              <FileCheck className="w-4 h-4" />
              Send Circular
            </Button>
            <Button
              className="w-full justify-start gap-2"
              size="sm"
              variant="destructive"
              onClick={() => setShowSendMessageModal(true)}
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Recent Communications
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadRecentCommunications}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {communicationLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentMessages.length === 0 && recentCirculars.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  No recent communications
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Send messages and circulars to personnel.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => setShowSendMessageModal(true)}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Message
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => setShowSendCircularModal(true)}
                  >
                    <FileCheck className="w-4 h-4" />
                    Circular
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Recent Messages */}
                {recentMessages.map((message) => (
                  <div
                    key={`msg-${message.id}`}
                    className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {message.subject}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {message.channels?.includes("email") && (
                          <Mail className="w-3 h-3 text-blue-500" />
                        )}
                        {message.channels?.includes("sms") && (
                          <MessageCircle className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-2">
                      {message.body}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{message.recipients?.length || 0} recipients</span>
                      <span>{new Date(message.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}

                {/* Recent Circulars */}
                {recentCirculars.map((circular) => (
                  <div
                    key={`circ-${circular.id}`}
                    className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {circular.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-blue-500" />
                        <MessageCircle className="w-3 h-3 text-green-500" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-2">
                      {circular.message}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{circular.recipient_count} recipients</span>
                      <span>{new Date(circular.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}

                <div className="pt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => setShowSendMessageModal(true)}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Send Message
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => setShowSendCircularModal(true)}
                  >
                    <FileCheck className="w-4 h-4" />
                    Send Circular
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <AddCaseModal
        open={showAddCaseModal}
        onOpenChange={setShowAddCaseModal}
        onCaseAdded={refreshData}
      />
      <AssignDutyModal
        open={showAddDutyModal}
        onOpenChange={setShowAddDutyModal}
        onDutyAssigned={refreshData}
      />
      <SendMessageModal
        open={showSendMessageModal}
        onOpenChange={setShowSendMessageModal}
      />
      <SendCircularModal
        open={showSendCircularModal}
        onOpenChange={setShowSendCircularModal}
        onCircularSent={loadRecentCommunications}
      />
    </div>
  );
}
