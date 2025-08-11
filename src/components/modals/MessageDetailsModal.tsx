import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCcw } from "lucide-react";

interface MessageDetailsModalProps {
  messageId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MessageDetailsModal({ messageId, open, onOpenChange }: MessageDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<any>(null);

  const load = async () => {
    if (!messageId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/messages/${messageId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load message");
      setMessage(data.message);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && messageId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, messageId]);

  const retryFailed = async () => {
    if (!message?.recipients) return;
    const failed = message.recipients.filter((r: any) => r.status === "failed");
    if (failed.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/personnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personnelIds: failed.map((r: any) => r.personnel_id),
          subject: message.subject,
          message: message.body,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Retry failed");
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Message Details</DialogTitle>
        </DialogHeader>
        {!messageId ? (
          <div className="text-sm text-muted-foreground">No message selected.</div>
        ) : loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading...
          </div>
        ) : message ? (
          <div className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Subject</div>
              <div className="font-medium">{message.subject}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Body</div>
              <div className="whitespace-pre-wrap text-sm">{message.body}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Recipients</div>
              <Button variant="outline" size="sm" onClick={retryFailed} className="gap-2">
                <RefreshCcw className="w-4 h-4" /> Retry Failed
              </Button>
            </div>
            <div className="max-h-64 overflow-auto border rounded-md">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-3 py-2">Email</th>
                    <th className="text-left px-3 py-2">Status</th>
                    <th className="text-left px-3 py-2">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {message.recipients?.map((r: any) => (
                    <tr key={r.id} className="border-t">
                      <td className="px-3 py-2">{r.email}</td>
                      <td className="px-3 py-2">
                        <Badge variant={r.status === "sent" ? "default" : r.status === "failed" ? "destructive" : "secondary"}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{r.error || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Message not found.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

