import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

import SendCircularModal from "@/components/modals/SendCircularModal";
import MessageDetailsModal from "@/components/modals/MessageDetailsModal";

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

interface Circular {
  id: string;
  title: string;
  message: string;
  unit: string;
  recipient_count: number;
  status: string;
  created_at: string;
}

interface CommunicationItem {
  id: string;
  type: 'message' | 'circular';
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
  unit?: string;
  recipient_count?: number;
  status?: string;
}

export default function Communication() {
  const [showSendCircularModal, setShowSendCircularModal] = useState(false);
  const [messages, setMessages] = useState<MessageWithRecipients[]>([]);
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(false);
  const [circularsLoading, setCircularsLoading] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CommunicationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
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

  // Combine messages and circulars into a single array
  const allCommunications: CommunicationItem[] = [
    ...messages.map(msg => ({
      ...msg,
      type: 'message' as const,
      subject: msg.subject,
      body: msg.body,
    })),
    ...circulars.map(circ => ({
      ...circ,
      type: 'circular' as const,
      subject: circ.title,
      body: circ.message,
    }))
  ];

  // Helper functions for message analysis
  const getChannelsUsed = (item: CommunicationItem) => {
    if (item.type === 'circular') {
      // Circulars use both email and SMS
      return ['email', 'sms'];
    }
    
    if (!item.recipients || item.recipients.length === 0) return [];

    const hasEmail = item.recipients.some(r => r.email && (r.email_status === "sent" || r.email_status === "pending"));
    const hasSMS = item.recipients.some(r => r.phone && (r.sms_status === "sent" || r.sms_status === "pending"));

    const channels = [];
    if (hasEmail) channels.push("email");
    if (hasSMS) channels.push("sms");
    return channels;
  };

  const getDeliveryStats = (item: CommunicationItem) => {
    if (item.type === 'circular') {
      // For circulars, show recipient count
      return { sent: item.recipient_count || 0, failed: 0, pending: 0 };
    }
    
    if (!item.recipients) return { sent: 0, failed: 0, pending: 0 };

    let sent = 0, failed = 0, pending = 0;

    item.recipients.forEach(r => {
      if (r.email_status === "sent" || r.sms_status === "sent") sent++;
      else if (r.email_status === "failed" || r.sms_status === "failed") failed++;
      else pending++;
    });

    return { sent, failed, pending };
  };

  const handleDelete = (item: CommunicationItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      if (itemToDelete.type === 'message') {
        const res = await fetch(`/api/messages/${itemToDelete.id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete message");
      } else {
        // Handle circular deletion if needed
        const res = await fetch(`/api/circulars/${itemToDelete.id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete circular");
      }

      toast({
        title: "✅ Item Deleted",
        description: `${itemToDelete.type === 'message' ? 'Message' : 'Circular'} "${itemToDelete.subject}" has been deleted.`,
      });
      load(); // Refresh messages
      loadCirculars(); // Refresh circulars
    } catch (error: any) {
      toast({
        title: "❌ Delete Failed",
        description: error?.message || "Failed to delete item",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // Enhanced filtering
  const filteredCommunications = allCommunications.filter((item) => {
    // Search filter
    const matchesSearch = searchTerm === "" ||
      item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.body.toLowerCase().includes(searchTerm.toLowerCase());

    // Type filter
    const matchesType = typeFilter === "all" || item.type === typeFilter;

    // Channel filter
    const channels = getChannelsUsed(item);
    const matchesChannel = channelFilter === "all" ||
      (channelFilter === "email" && channels.includes("email")) ||
      (channelFilter === "sms" && channels.includes("sms")) ||
      (channelFilter === "both" && channels.includes("email") && channels.includes("sms"));

    // Status filter
    const stats = getDeliveryStats(item);
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "sent" && stats.sent > 0) ||
      (statusFilter === "failed" && stats.failed > 0) ||
      (statusFilter === "pending" && stats.pending > 0);

    return matchesSearch && matchesType && matchesChannel && matchesStatus;
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
            View all communications, alerts, and circulars
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowSendCircularModal(true)}
          >
            <FileCheck className="w-4 h-4" />
            Send Circular
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

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="message">Messages</SelectItem>
            <SelectItem value="circular">Circulars</SelectItem>
          </SelectContent>
        </Select>

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

        <Button variant="outline" size="sm" onClick={() => { load(); loadCirculars(); }} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Communications Table */}
      {loading || circularsLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          Loading communications...
        </div>
      ) : filteredCommunications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="w-16 h-16 text-muted-foreground/50 mb-6" />
            <h3 className="text-lg font-semibold mb-2">
              {allCommunications.length === 0 ? "No Communications Found" : "No matching communications"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {allCommunications.length === 0
                ? "Start communicating with your team. Send circulars to all personnel or individual messages from the personnel page."
                : "Try adjusting your search terms to find what you're looking for."}
            </p>
            {allCommunications.length === 0 && (
              <Button className="gap-2" onClick={() => setShowSendCircularModal(true)}>
                <Plus className="w-4 h-4" />
                Send Circular
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
                  Type
                </th>
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
              {filteredCommunications.map((item) => {
                const channels = getChannelsUsed(item);
                const stats = getDeliveryStats(item);

                return (
                  <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={item.type === 'circular' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {item.type === 'circular' ? (
                          <>
                            <FileCheck className="w-3 h-3 mr-1" />
                            Circular
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Message
                          </>
                        )}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 line-clamp-1">
                        {item.subject}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 line-clamp-2 max-w-md">
                        {item.body}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleTimeString()}
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
                        {item.type === 'circular' 
                          ? `${item.recipient_count || 0} personnel`
                          : `${item.recipients?.length || 0} recipients`
                        }
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
                            onClick={() => setSelectedMessageId(item.id)}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(item)}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {itemToDelete?.type === 'circular' ? 'Circular' : 'Message'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the {itemToDelete?.type === 'circular' ? 'circular' : 'message'} "{itemToDelete?.subject}"?
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

      {/* Message Details Modal */}
      <MessageDetailsModal
        messageId={selectedMessageId}
        open={!!selectedMessageId}
        onOpenChange={(open) => !open && setSelectedMessageId(null)}
      />

      {/* Send Circular Modal */}
      <SendCircularModal
        open={showSendCircularModal}
        onOpenChange={setShowSendCircularModal}
        onCircularSent={loadCirculars}
      />
    </div>
  );
}
