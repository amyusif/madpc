import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabaseHelpers } from "@/integrations/supabase/client";
import { useAppData } from "@/hooks/useAppData";
import { MessageSquare, AlertTriangle, Loader2, Send } from "lucide-react";

interface SendMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SendMessageModal({
  open,
  onOpenChange,
}: SendMessageModalProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("message");
  const { toast } = useToast();
  const { personnel } = useAppData();

  const [messageData, setMessageData] = useState({
    title: "",
    message: "",
    priority: "medium",
    recipients: "all",
  });

  const [alertData, setAlertData] = useState({
    title: "",
    message: "",
    type: "info",
    priority: "medium",
  });

  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!messageData.title.trim()) throw new Error("Message title is required");
      if (!messageData.message.trim()) throw new Error("Message content is required");

      // Determine recipients
      const all = personnel || [];
      const ids =
        messageData.recipients === "all"
          ? all.map((p: any) => p.id)
          : all
              .filter((p: any) =>
                (p.unit || "").toLowerCase().includes(messageData.recipients)
              )
              .map((p: any) => p.id);

      if (ids.length === 0) throw new Error("No recipients found for selection");

      // Send emails via notifications API
      const res = await fetch("/api/notifications/personnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personnelIds: ids,
          subject: messageData.title,
          message: messageData.message,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to send message");

      toast({
        title: "✅ Message Sent",
        description: `Sent to ${data.sent ?? ids.length} recipient(s)${
          data.failed ? ", failed: " + data.failed : ""
        }`,
        duration: 5000,
      });

      setMessageData({ title: "", message: "", priority: "medium", recipients: "all" });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "❌ Failed to Send Message",
        description: error?.message || "Something went wrong. Please try again.",
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!alertData.title.trim()) throw new Error("Alert title is required");
      if (!alertData.message.trim()) throw new Error("Alert message is required");

      // Broadcast to all personnel by default
      const all = personnel || [];
      const ids = all.map((p: any) => p.id);
      if (ids.length === 0) throw new Error("No personnel to notify");

      const res = await fetch("/api/notifications/personnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personnelIds: ids,
          subject: alertData.title,
          message: alertData.message,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to broadcast alert");

      toast({
        title: "🚨 Alert Broadcasted",
        description: `Sent to ${data.sent ?? ids.length} personnel${
          data.failed ? ", failed: " + data.failed : ""
        }`,
        duration: 5000,
      });

      setAlertData({ title: "", message: "", type: "info", priority: "medium" });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error sending alert:", error);
      toast({
        title: "❌ Failed to Send Alert",
        description: error?.message || "Something went wrong. Please try again.",
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Send Message or Alert
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Send messages to personnel or broadcast urgent alerts
          </p>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="message" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Message
            </TabsTrigger>
            <TabsTrigger value="alert" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              Alert
            </TabsTrigger>
          </TabsList>

          <TabsContent value="message">
            <form onSubmit={handleMessageSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="messageTitle">Message Title *</Label>
                <Input
                  id="messageTitle"
                  placeholder="Enter message title"
                  value={messageData.title}
                  onChange={(e) =>
                    setMessageData({ ...messageData, title: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="messagePriority">Priority</Label>
                  <Select
                    value={messageData.priority}
                    onValueChange={(value) =>
                      setMessageData({ ...messageData, priority: value })
                    }
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="messageRecipients">Recipients</Label>
                  <Select
                    value={messageData.recipients}
                    onValueChange={(value) =>
                      setMessageData({ ...messageData, recipients: value })
                    }
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Personnel</SelectItem>
                      <SelectItem value="patrol">Patrol Unit</SelectItem>
                      <SelectItem value="investigation">
                        Investigation Unit
                      </SelectItem>
                      <SelectItem value="traffic">Traffic Unit</SelectItem>
                      <SelectItem value="admin">Administration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="messageContent">Message *</Label>
                <Textarea
                  id="messageContent"
                  placeholder="Enter your message..."
                  value={messageData.message}
                  onChange={(e) =>
                    setMessageData({ ...messageData, message: e.target.value })
                  }
                  required
                  disabled={loading}
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="alert">
            <form onSubmit={handleAlertSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="alertTitle">Alert Title *</Label>
                <Input
                  id="alertTitle"
                  placeholder="Enter alert title"
                  value={alertData.title}
                  onChange={(e) =>
                    setAlertData({ ...alertData, title: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="alertType">Alert Type</Label>
                  <Select
                    value={alertData.type}
                    onValueChange={(value) =>
                      setAlertData({ ...alertData, type: value })
                    }
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select alert type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Information</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Emergency</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alertPriority">Priority</Label>
                  <Select
                    value={alertData.priority}
                    onValueChange={(value) =>
                      setAlertData({ ...alertData, priority: value })
                    }
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alertMessage">Alert Message *</Label>
                <Textarea
                  id="alertMessage"
                  placeholder="Enter alert message..."
                  value={alertData.message}
                  onChange={(e) =>
                    setAlertData({ ...alertData, message: e.target.value })
                  }
                  required
                  disabled={loading}
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Broadcasting...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      Send Alert
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
