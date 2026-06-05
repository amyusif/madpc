"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { db } from "@/integrations/database";
import type { Case } from "@/integrations/database";
import { useToast } from "@/hooks/use-toast";
import { FileText, Paperclip, X, Upload } from "lucide-react";

interface AddCaseReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseItem: Case | null;
  onReportAdded: () => Promise<void>;
  createdBy?: string;
}

export default function AddCaseReportModal({
  open,
  onOpenChange,
  caseItem,
  onReportAdded,
  createdBy,
}: AddCaseReportModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    report_text: "",
    court_ruling: "",
    court_date: "",
    presiding_judge: "",
  });

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleEvidenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    const uploaded: string[] = [];

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "evidence");
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        const url = data.url || data.path || data.fileUrl || "";
        if (url) uploaded.push(url);
      } catch {
        toast({ title: "Upload error", description: `Could not upload ${file.name}`, variant: "destructive" });
      }
    }

    setEvidenceUrls((prev) => [...prev, ...uploaded]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeEvidence = (idx: number) => {
    setEvidenceUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseItem) return;
    if (!form.report_text.trim()) {
      toast({ title: "Report text required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await db.createCaseReport({
        case_id: caseItem.id,
        report_text: form.report_text,
        court_ruling: form.court_ruling || null,
        court_date: form.court_date || null,
        presiding_judge: form.presiding_judge || null,
        evidence_urls: evidenceUrls,
        created_by: createdBy || null,
      });

      toast({ title: "✅ Report Saved", description: `Court report for ${caseItem.case_number} has been saved.` });
      await onReportAdded();
      onOpenChange(false);
      setForm({ report_text: "", court_ruling: "", court_date: "", presiding_judge: "" });
      setEvidenceUrls([]);
    } catch (err: any) {
      toast({ title: "Failed to save report", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getFileName = (url: string) => url.split("/").pop() || url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-5 h-5 text-indigo-600" />
            Log Court Report
            {caseItem && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                — {caseItem.case_number}: {caseItem.case_title}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Court Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="court_date">Court Date</Label>
              <Input
                id="court_date"
                type="date"
                value={form.court_date}
                onChange={(e) => set("court_date", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="presiding_judge">Presiding Judge</Label>
              <Input
                id="presiding_judge"
                value={form.presiding_judge}
                onChange={(e) => set("presiding_judge", e.target.value)}
                placeholder="Judge's full name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="court_ruling">Court Ruling / Verdict</Label>
            <Textarea
              id="court_ruling"
              value={form.court_ruling}
              onChange={(e) => set("court_ruling", e.target.value)}
              placeholder="Summary of the court's verdict..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="report_text">Full Case Report *</Label>
            <Textarea
              id="report_text"
              value={form.report_text}
              onChange={(e) => set("report_text", e.target.value)}
              placeholder="Detailed report on the case proceedings, evidence presented, and outcome..."
              rows={6}
              required
            />
          </div>

          {/* Evidence Upload */}
          <div>
            <Label>Media Evidence</Label>
            <div className="mt-2 space-y-3">
              <div
                className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-300 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                <p className="text-sm text-gray-500">Click to upload evidence files</p>
                <p className="text-xs text-gray-400 mt-0.5">Images, PDFs, documents (multiple allowed)</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.mp4,.mov"
                className="hidden"
                onChange={handleEvidenceUpload}
                disabled={uploading}
              />

              {uploading && (
                <p className="text-sm text-indigo-600 animate-pulse">Uploading files...</p>
              )}

              {evidenceUrls.length > 0 && (
                <div className="space-y-2">
                  {evidenceUrls.map((url, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-md px-3 py-2">
                      <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate flex-1">{getFileName(url)}</span>
                      <button type="button" onClick={() => removeEvidence(i)} className="text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || uploading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {saving ? "Saving..." : "Save Report"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
