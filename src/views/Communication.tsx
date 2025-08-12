import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  MessageSquare,
  AlertTriangle,
  FileCheck,
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Trash2,
  Loader2,
  Mail,
  MessageCircle,
  Users,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Send,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import SendMessageModal from "@/components/modals/SendMessageAlertModal";
import MessageDetailsModal from "@/components/modals/MessageDetailsModal";
import SendCircularModal from "@/components/modals/SendCircularModal";

interface MessageWithRecipients {
  id: string;
  subject: string;
  body: string;
  created_at: string;
  created_by?: string;
  recipients?: Array<{
    id: string;
    personnel_id: string;
    email: string;
    phone: string;
    email_status?: string;
    sms_status?: string;
  }>;
}

export default function Communication() {
  const [showSendMessageModal, setShowSendMessageModal] = useState(false);
  const [showSendCircularModal, setShowSendCircularModal] = useState(false);
  const [messages, setMessages] = useState<MessageWithRecipients[]>([]);
  const [circulars, setCirculars] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [circularsLoading, setCircularsLoading] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<MessageWithRecipients | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load messages");
      setMessages(data.messages || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadCirculars = async () => {
    setCircularsLoading(true);
    try {
      const res = await fetch("/api/circulars");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load circulars");
      setCirculars(data.circulars || []);
    } catch (e) {
      console.error(e);
    } finally {
      setCircularsLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadCirculars();
  }, []);

  // Helper functions for message analysis
  const getChannelsUsed = (message: MessageWithRecipients) => {
    if (!message.recipients || message.recipients.length === 0) return [];

    const hasEmail = message.recipients.some(r => r.email && (r.email_status === "sent" || r.email_status === "pending"));
    const hasSMS = message.recipients.some(r => r.phone && (r.sms_status === "sent" || r.sms_status === "pending"));

    const channels = [];
    if (hasEmail) channels.push("email");
    if (hasSMS) channels.push("sms");
    return channels;
  };

  const getDeliveryStats = (message: MessageWithRecipients) => {
    if (!message.recipients) return { sent: 0, failed: 0, pending: 0 };

    let sent = 0, failed = 0, pending = 0;

    message.recipients.forEach(r => {
      if (r.email_status === "sent" || r.sms_status === "sent") sent++;
      else if (r.email_status === "failed" || r.sms_status === "failed") failed++;
      else pending++;
    });

    return { sent, failed, pending };
  };

  const handleDelete = (message: MessageWithRecipients) => {
    setMessageToDelete(message);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!messageToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/messages/${messageToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete message");

      toast({
        title: "✅ Message Deleted",
        description: `Message "${messageToDelete.subject}" has been deleted.`,
      });
      load(); // Refresh messages
    } catch (error: any) {
      toast({
        title: "❌ Delete Failed",
        description: error?.message || "Failed to delete message",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
    }
  };

  // Enhanced filtering
  const filteredMessages = messages.filter((message) => {
    // Search filter
    const matchesSearch = searchTerm === "" ||
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.body.toLowerCase().includes(searchTerm.toLowerCase());

    // Channel filter
    const channels = getChannelsUsed(message);
    const matchesChannel = channelFilter === "all" ||
      (channelFilter === "email" && channels.includes("email")) ||
      (channelFilter === "sms" && channels.includes("sms")) ||
      (channelFilter === "both" && channels.includes("email") && channels.includes("sms"));

    // Status filter
    const stats = getDeliveryStats(message);
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "sent" && stats.sent > 0) ||
      (statusFilter === "failed" && stats.failed > 0) ||
      (statusFilter === "pending" && stats.pending > 0);

    return matchesSearch && matchesChannel && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Communication Center
          </h1>
          <p className="text-muted-foreground">
            Manage messages, alerts, and circulars
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowSendCircularModal(true)}
          >
            <FileCheck className="w-4 h-4" />
            Send Circular
          </Button>
          <Button
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowSendMessageModal(true)}
          >
            <MessageSquare className="w-4 h-4" />
            Send Message/Alert
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search communications and alerts..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="email">Email Only</SelectItem>
            <SelectItem value="sms">SMS Only</SelectItem>
            <SelectItem value="both">Email + SMS</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={load} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Communication Tabs */}
      <Tabs defaultValue="messages" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="messages" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="w-4 h-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="circulars" className="gap-2">
            <FileCheck className="w-4 h-4" />
            Circulars
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">Loading messages...</div>
          ) : filteredMessages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <MessageSquare className="w-16 h-16 text-muted-foreground/50 mb-6" />
                <h3 className="text-lg font-semibold mb-2">
                  {messages.length === 0 ? "No Messages Found" : "No matching messages"}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {messages.length === 0
                    ? "Start communicating with your team. Send messages to individual personnel or groups."
                    : "Try adjusting your search terms to find what you're looking for."}
                </p>
                {messages.length === 0 && (
                  <Button className="gap-2" onClick={() => setShowSendMessageModal(true)}>
                    <Plus className="w-4 h-4" />
                    Send Message
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="bg-white rounded-lg border shadow-sm">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Sent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Channel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMessages.map((message) => {
                    const channels = getChannelsUsed(message);
                    const stats = getDeliveryStats(message);

                    return (
                      <tr key={message.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 line-clamp-1">
                            {message.subject}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 line-clamp-2 max-w-md">
                            {message.body}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(message.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {channels.includes("email") && (
                              <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full">
                                <Mail className="w-4 h-4 text-blue-600" />
                                <span className="text-xs font-medium text-blue-700">Email</span>
                              </div>
                            )}
                            {channels.includes("sms") && (
                              <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                                <MessageCircle className="w-4 h-4 text-green-600" />
                                <span className="text-xs font-medium text-green-700">SMS</span>
                              </div>
                            )}
                            {channels.length === 0 && (
                              <span className="text-xs text-gray-400">No channels</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="secondary" className="text-xs">
                            {message.recipients?.length || 0} recipients
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {stats.sent > 0 && (
                              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                {stats.sent} sent
                              </Badge>
                            )}
                            {stats.failed > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {stats.failed} failed
                              </Badge>
                            )}
                            {stats.pending > 0 && (
                              <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                {stats.pending} pending
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => setSelectedMessageId(message.id)}
                                className="cursor-pointer"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(message)}
                                className="cursor-pointer text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <MessageDetailsModal
            messageId={selectedMessageId}
            open={!!selectedMessageId}
            onOpenChange={(open) => !open && setSelectedMessageId(null)}
          />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <AlertTriangle className="w-16 h-16 text-muted-foreground/50 mb-6" />
              <h3 className="text-lg font-semibold mb-2">No Alerts Found</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Send urgent alerts to personnel for immediate attention and
                action.
              </p>
              <Button
                variant="destructive"
                className="gap-2"
                onClick={() => setShowSendMessageModal(true)}
              >
                <AlertTriangle className="w-4 h-4" />
                Send Alert
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="circulars" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {circularsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : circulars.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileCheck className="w-16 h-16 text-muted-foreground/50 mb-6" />
                  <h3 className="text-lg font-semibold mb-2">No Circulars Found</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Disseminate official circulars and notices to all personnel for
                    reading and acknowledgment.
                  </p>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setShowSendCircularModal(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Create Circular
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Recipients
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Channels
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date Sent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {circulars.map((circular: any) => (
                        <tr key={circular.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <FileCheck className="w-5 h-5 text-blue-500 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {circular.title}
                                </div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {circular.message}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {circular.unit === "all" ? "All Personnel" : circular.unit}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {circular.recipient_count} personnel
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full">
                                <Mail className="w-4 h-4 text-blue-600" />
                                <span className="text-xs font-medium text-blue-700">Email</span>
                              </div>
                              <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                                <MessageCircle className="w-4 h-4 text-green-600" />
                                <span className="text-xs font-medium text-green-700">SMS</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(circular.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {circular.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the message "{messageToDelete?.subject}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modals */}
      <SendMessageModal
        open={showSendMessageModal}
        onOpenChange={setShowSendMessageModal}
      />
      <SendCircularModal
        open={showSendCircularModal}
        onOpenChange={setShowSendCircularModal}
        onCircularSent={loadCirculars}
      />
    </div>
  );
}
