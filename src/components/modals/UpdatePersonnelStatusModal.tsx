import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabaseHelpers } from "@/integrations/supabase/client";
import type { Personnel } from "@/integrations/supabase/client";

interface UpdatePersonnelStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personnel: Personnel | null;
  onUpdated?: () => void;
}

export default function UpdatePersonnelStatusModal({ open, onOpenChange, personnel, onUpdated }: UpdatePersonnelStatusModalProps) {
  const [status, setStatus] = useState<string>(personnel?.status || "active");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!personnel) return;
    setLoading(true);
    try {
      await supabaseHelpers.updatePersonnel(personnel.id, {
        status: status as "active" | "inactive" | "suspended" | "retired"
      });
      toast({ title: "✅ Status Updated", description: `${personnel.first_name} ${personnel.last_name} is now ${status}.` });
      onOpenChange(false);
      onUpdated?.();
    } catch (e: any) {
      toast({ title: "❌ Failed to update", description: e?.message || "Please try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Update Status</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Personnel</Label>
            <div className="text-sm font-medium">{personnel ? `${personnel.first_name} ${personnel.last_name} (${personnel.badge_number})` : "No selection"}</div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
