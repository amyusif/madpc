"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, FileCheck, Mail, MessageCircle, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppData } from "@/hooks/useAppData";

interface SendCircularModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCircularSent?: () => void;
}

export default function SendCircularModal({ 
  open, 
  onOpenChange, 
  onCircularSent 
}: SendCircularModalProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [allPersonnel, setAllPersonnel] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { personnel } = useAppData();

  // Available units
  const units = [
    "patrol",
    "investigation", 
    "traffic",
    "admin",
    "special"
  ];

  const unitLabels: Record<string, string> = {
    patrol: "Patrol Unit",
    investigation: "Investigation Unit", 
    traffic: "Traffic Unit",
    admin: "Administration",
    special: "Special Operations"
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setTitle("");
      setMessage("");
      setSelectedUnit("");
      setAllPersonnel(false);
    }
  }, [open]);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both title and message",
        variant: "destructive",
      });
      return;
    }

    if (!allPersonnel && !selectedUnit) {
      toast({
        title: "Validation Error", 
        description: "Please select a unit or check 'All Personnel'",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Determine recipients
      let recipients = [];
      if (allPersonnel) {
        recipients = personnel.map(p => p.id);
      } else {
        recipients = personnel.filter(p => p.unit === selectedUnit).map(p => p.id);
      }

      if (recipients.length === 0) {
        toast({
          title: "No Recipients",
          description: "No personnel found for the selected criteria",
          variant: "destructive",
        });
        return;
      }

      // Send circular
      const res = await fetch("/api/circulars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          unit: allPersonnel ? "all" : selectedUnit,
          recipients,
          channels: ["email", "sms"] // Always send via both channels
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send circular");

      toast({
        title: "✅ Circular Sent Successfully!",
        description: `Sent to ${recipients.length} personnel via Email & SMS`,
        duration: 5000,
      });

      onOpenChange(false);
      onCircularSent?.();
    } catch (error: any) {
      console.error("Circular send error:", error);
      toast({
        title: "❌ Failed to Send Circular",
        description: error?.message || "Something went wrong",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const recipientCount = allPersonnel 
    ? personnel.length 
    : personnel.filter(p => p.unit === selectedUnit).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600" />
            Send Circular
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recipient Info */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Users className="w-4 h-4" />
              <span>
                {recipientCount > 0 
                  ? `${recipientCount} recipient(s) selected`
                  : "No recipients selected"
                }
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-blue-600">
              <div className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                <span>SMS</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Circular Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter circular title..."
              disabled={loading}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your circular message..."
              disabled={loading}
            />
          </div>

          {/* Recipients Selection */}
          <div className="space-y-4">
            <Label>Recipients</Label>
            
            {/* All Personnel Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allPersonnel"
                checked={allPersonnel}
                onCheckedChange={(checked) => {
                  setAllPersonnel(checked as boolean);
                  if (checked) {
                    setSelectedUnit("");
                  }
                }}
                disabled={loading}
              />
              <Label htmlFor="allPersonnel" className="text-sm font-medium">
                Send to All Personnel
              </Label>
            </div>

            {/* Unit Selection */}
            <div className="space-y-2">
              <Label htmlFor="unit">Or Select Unit</Label>
              <Select
                value={selectedUnit}
                onValueChange={(value) => {
                  setSelectedUnit(value);
                  if (value) {
                    setAllPersonnel(false);
                  }
                }}
                disabled={allPersonnel || loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a unit..." />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unitLabels[unit]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={loading || !title.trim() || !message.trim() || (!allPersonnel && !selectedUnit)}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Circular
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
