import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { LeaveRequest } from "@/integrations/database";

type LeaveMode = "management" | "officer" | "none";

const LEAVE_TYPE_OPTIONS = [
  { value: "annual", label: "Annual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "casual", label: "Casual Leave" },
  { value: "compassionate", label: "Compassionate Leave" },
  { value: "maternity", label: "Maternity Leave" },
  { value: "paternity", label: "Paternity Leave" },
  { value: "study", label: "Study Leave" },
  { value: "unpaid", label: "Unpaid Leave" },
] as const;

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-200 text-gray-700",
};

export default function Leave() {
  const { toast } = useToast();
  const [mode, setMode] = useState<LeaveMode>("none");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [form, setForm] = useState({
    leave_type: "annual",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === "pending").length,
    [requests]
  );

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leave");
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || "Failed to load leave requests");
      setMode(payload.mode || "none");
      setRequests(payload.data || []);
    } catch (error: any) {
      toast({
        title: "Unable to load leave data",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const submitLeaveRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || "Failed to submit leave request");

      setForm({
        leave_type: "annual",
        start_date: "",
        end_date: "",
        reason: "",
      });
      toast({
        title: "Leave request submitted",
        description: "Your leave request has been sent for approval.",
      });
      await fetchLeaveRequests();
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const reviewLeaveRequest = async (id: string, status: "approved" | "rejected") => {
    setReviewingId(id);
    try {
      const res = await fetch(`/api/leave/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          admin_note: reviewNote.trim() || null,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || "Failed to review request");

      toast({
        title: status === "approved" ? "Leave approved" : "Leave rejected",
        description: "The leave request status has been updated.",
      });
      await fetchLeaveRequests();
    } catch (error: any) {
      toast({
        title: "Review failed",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setReviewingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-muted-foreground">Loading leave requests...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground mt-1">
            Officers can request leave, while management reviews and approves.
          </p>
        </div>
        <Button variant="outline" onClick={fetchLeaveRequests}>
          Refresh
        </Button>
      </div>

      {mode === "officer" && (
        <Card>
          <CardHeader>
            <CardTitle>Request Leave</CardTitle>
            <CardDescription>Submit your leave request for management approval.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={submitLeaveRequest}>
              <div className="space-y-2">
                <Label htmlFor="leave_type">Leave Type</Label>
                <select
                  id="leave_type"
                  className="w-full border rounded-md h-10 px-3 bg-background"
                  value={form.leave_type}
                  onChange={(e) => setForm((prev) => ({ ...prev, leave_type: e.target.value }))}
                >
                  {LEAVE_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div />

              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  rows={4}
                  value={form.reason}
                  onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="State the reason for your leave request"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Leave Request"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {mode === "management" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock3 className="w-4 h-4" />
              Pending Approvals ({pendingCount})
            </CardTitle>
            <CardDescription>Review pending leave requests and take action.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="review_note">Management Note (optional)</Label>
              <Textarea
                id="review_note"
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Add notes for the officer before approving/rejecting"
              />
            </div>
            {requests.filter((req) => req.status === "pending").length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending leave requests.</p>
            ) : (
              <div className="space-y-3">
                {requests
                  .filter((req) => req.status === "pending")
                  .map((req) => (
                    <div key={req.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">
                            {req.personnel?.first_name} {req.personnel?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {req.personnel?.badge_number} | {req.personnel?.rank} | {req.personnel?.unit}
                          </p>
                        </div>
                        <Badge className={STATUS_STYLE[req.status] || STATUS_STYLE.pending}>
                          {req.status}
                        </Badge>
                      </div>
                      <p className="text-sm">
                        <span className="font-medium">Type:</span> {req.leave_type}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Dates:</span> {req.start_date} to {req.end_date} (
                        {req.days_requested} day{req.days_requested > 1 ? "s" : ""})
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Reason:</span> {req.reason}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="gap-1"
                          disabled={reviewingId === req.id}
                          onClick={() => reviewLeaveRequest(req.id, "approved")}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                          disabled={reviewingId === req.id}
                          onClick={() => reviewLeaveRequest(req.id, "rejected")}
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            {mode === "management" ? "All Leave Requests" : "My Leave Requests"}
          </CardTitle>
          <CardDescription>Track submitted leave applications and their status.</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leave requests found.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {mode === "management"
                          ? `${req.personnel?.first_name ?? ""} ${req.personnel?.last_name ?? ""}`.trim()
                          : `${req.leave_type} leave`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {req.start_date} to {req.end_date} | {req.days_requested} day
                        {req.days_requested > 1 ? "s" : ""}
                      </p>
                    </div>
                    <Badge className={STATUS_STYLE[req.status] || STATUS_STYLE.pending}>
                      {req.status}
                    </Badge>
                  </div>
                  <p className="text-sm">{req.reason}</p>
                  {req.admin_note && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Management note:</span> {req.admin_note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
