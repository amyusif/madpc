import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Mail, MessageSquare, Users, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import NotificationTemplatesModal from "./NotificationTemplatesModal";

interface ComposeMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
}

export default function ComposeMessageModal({ open, onOpenChange, selectedIds }: ComposeMessageModalProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [channels, setChannels] = useState<string[]>(["email"]);
  const [loading, setLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const { toast } = useToast();

  const handleChannelChange = (channel: string, checked: boolean) => {
    if (checked) {
      setChannels([...channels, channel]);
    } else {
      setChannels(channels.filter(c => c !== channel));
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim() || selectedIds.length === 0 || channels.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/personnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personnelIds: selectedIds,
          subject,
          message: body,
          channels
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");

      toast({
        title: "✅ Message Sent",
        description: `Sent to ${data.total?.sent || 0} recipient(s) via ${channels.join(", ")}${
          data.total?.failed ? `, ${data.total.failed} failed` : ""
        }`,
        duration: 5000,
      });

      onOpenChange(false);
      setSubject("");
      setBody("");
      setChannels(["email"]);
    } catch (e: any) {
      toast({
        title: "❌ Failed to Send",
        description: e?.message || "Something went wrong",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: any) => {
    setSubject(template.subject);
    setBody(template.body);
    setShowTemplates(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Compose Message
            </DialogTitle>
          </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{selectedIds.length} recipient(s) selected</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)} className="gap-2">
              <FileText className="w-4 h-4" />
              Templates
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Delivery Channels</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email"
                  checked={channels.includes("email")}
                  onCheckedChange={(checked) => handleChannelChange("email", !!checked)}
                />
                <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sms"
                  checked={channels.includes("sms")}
                  onCheckedChange={(checked) => handleChannelChange("sms", !!checked)}
                />
                <Label htmlFor="sms" className="flex items-center gap-2 cursor-pointer">
                  <MessageSquare className="w-4 h-4" />
                  SMS
                </Label>
              </div>
            </div>
            {channels.length > 0 && (
              <div className="flex gap-1">
                {channels.map(channel => (
                  <Badge key={channel} variant="secondary" className="text-xs">
                    {channel.toUpperCase()}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={loading || !subject.trim() || !body.trim() || channels.length === 0}
              className="gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send via {channels.join(" & ")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <NotificationTemplatesModal
      open={showTemplates}
      onOpenChange={setShowTemplates}
      onSelectTemplate={handleTemplateSelect}
    />
    </>
  );
}

