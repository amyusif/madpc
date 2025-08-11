import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  AlertTriangle,
  FileCheck,
  Search,
  Plus,
} from "lucide-react";
import SMSTestButton from "@/components/SMSTestButton";
import SendMessageModal from "@/components/modals/SendMessageAlertModal";
import MessageDetailsModal from "@/components/modals/MessageDetailsModal";

export default function Communication() {
  const [showSendMessageModal, setShowSendMessageModal] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

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

  useEffect(() => {
    load();
  }, []);

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
          <SMSTestButton />
          <Button
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowSendMessageModal(true)}
          >
            <MessageSquare className="w-4 h-4" />
            Send Message/Alert
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search communications and alerts..."
            className="pl-9"
          />
        </div>
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
          ) : messages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <MessageSquare className="w-16 h-16 text-muted-foreground/50 mb-6" />
                <h3 className="text-lg font-semibold mb-2">No Messages Found</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Start communicating with your team. Send messages to individual
                  personnel or groups.
                </p>
                <Button className="gap-2" onClick={() => setShowSendMessageModal(true)}>
                  <Plus className="w-4 h-4" />
                  Send Message
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {messages.map((m) => (
                <Card key={m.id} className="cursor-pointer" onClick={() => setSelectedMessageId(m.id)}>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">{new Date(m.created_at).toLocaleString()}</div>
                    <div className="font-medium line-clamp-1">{m.subject}</div>
                    <div className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap">{m.body}</div>
                  </CardContent>
                </Card>
              ))}
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
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileCheck className="w-16 h-16 text-muted-foreground/50 mb-6" />
              <h3 className="text-lg font-semibold mb-2">No Circulars Found</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Disseminate official circulars and notices to all personnel for
                reading and acknowledgment.
              </p>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setShowSendMessageModal(true)}
              >
                <Plus className="w-4 h-4" />
                Create Circular
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <SendMessageModal
        open={showSendMessageModal}
        onOpenChange={setShowSendMessageModal}
      />
    </div>
  );
}
