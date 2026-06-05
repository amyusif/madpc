"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/integrations/database";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Upload, X } from "lucide-react";

interface AddConvictModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConvictAdded: () => Promise<void>;
  prefilledCaseId?: string;
  prefilledCaseNumber?: string;
}

export default function AddConvictModal({
  open,
  onOpenChange,
  onConvictAdded,
  prefilledCaseId,
  prefilledCaseNumber,
}: AddConvictModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    alias: "",
    gender: "",
    date_of_birth: "",
    nationality: "",
    photo_url: "",
    case_id: prefilledCaseId || "",
    case_number: prefilledCaseNumber || "",
    crime_type: "",
    sentence: "",
    sentence_start_date: "",
    sentence_end_date: "",
    date_in: "",
    date_out: "",
    status: "imprisoned" as "imprisoned" | "released" | "deceased" | "escaped",
    court_ruling: "",
    court_date: "",
    presiding_judge: "",
    notes: "",
  });

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "convict");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const url = data.url || data.path || data.fileUrl || "";
      set("photo_url", url);
      setPhotoPreview(url);
    } catch {
      // Fallback to local preview if upload fails
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setPhotoPreview(result);
      };
      reader.readAsDataURL(file);
      toast({
        title: "Photo preview only",
        description: "Could not upload to server — photo shown as preview only.",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.crime_type || !form.sentence) {
      toast({ title: "Required fields missing", description: "Name, crime type and sentence are required.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await db.createConvict({
        full_name: form.full_name,
        alias: form.alias || null,
        gender: form.gender || null,
        date_of_birth: form.date_of_birth || null,
        nationality: form.nationality || null,
        photo_url: form.photo_url || null,
        case_id: form.case_id || null,
        case_number: form.case_number || null,
        crime_type: form.crime_type,
        sentence: form.sentence,
        sentence_start_date: form.sentence_start_date || null,
        sentence_end_date: form.sentence_end_date || null,
        date_in: form.date_in || null,
        date_out: form.date_out || null,
        status: form.status,
        court_ruling: form.court_ruling || null,
        court_date: form.court_date || null,
        presiding_judge: form.presiding_judge || null,
        notes: form.notes || null,
      });

      toast({ title: "✅ Convict Added", description: `${form.full_name} added to Convict DB.` });
      await onConvictAdded();
      onOpenChange(false);
      setForm({
        full_name: "", alias: "", gender: "", date_of_birth: "", nationality: "",
        photo_url: "", case_id: "", case_number: "", crime_type: "", sentence: "",
        sentence_start_date: "", sentence_end_date: "", date_in: "", date_out: "",
        status: "imprisoned", court_ruling: "", court_date: "", presiding_judge: "", notes: "",
      });
      setPhotoPreview(null);
    } catch (err: any) {
      toast({ title: "Failed to add convict", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="w-5 h-5 text-red-600" />
            Add Convict Record
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo */}
          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="w-28 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 relative">
                {photoPreview ? (
                  <>
                    <img src={photoPreview} alt="Mug shot" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setPhotoPreview(null); set("photo_url", ""); }}
                      className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-2">
                    <Upload className="w-6 h-6 text-gray-400 mx-auto" />
                    <p className="text-xs text-gray-400 mt-1">Mug Shot</p>
                  </div>
                )}
              </div>
              <label className="cursor-pointer">
                <Input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                />
                <span className="text-xs text-blue-600 hover:underline">
                  {uploadingPhoto ? "Uploading..." : "Upload Photo"}
                </span>
              </label>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input id="full_name" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="e.g. John Doe" required />
              </div>
              <div>
                <Label htmlFor="alias">Alias / Nickname</Label>
                <Input id="alias" value={form.alias} onChange={(e) => set("alias", e.target.value)} placeholder="Street name, alias" />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input id="date_of_birth" type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="nationality">Nationality</Label>
              <Input id="nationality" value={form.nationality} onChange={(e) => set("nationality", e.target.value)} placeholder="e.g. Ghanaian" />
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Case Link */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="case_number">Linked Case Number</Label>
              <Input id="case_number" value={form.case_number} onChange={(e) => set("case_number", e.target.value)} placeholder="e.g. CAS-2024-001" />
            </div>
            <div>
              <Label htmlFor="status">Convict Status *</Label>
              <Select value={form.status} onValueChange={(v: any) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="imprisoned">Imprisoned</SelectItem>
                  <SelectItem value="released">Released</SelectItem>
                  <SelectItem value="deceased">Deceased</SelectItem>
                  <SelectItem value="escaped">Escaped</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Crime & Sentence */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="crime_type">Crime Type *</Label>
              <Input id="crime_type" value={form.crime_type} onChange={(e) => set("crime_type", e.target.value)} placeholder="e.g. Armed Robbery" required />
            </div>
            <div>
              <Label htmlFor="sentence">Sentence *</Label>
              <Input id="sentence" value={form.sentence} onChange={(e) => set("sentence", e.target.value)} placeholder="e.g. 10 years imprisonment" required />
            </div>
            <div>
              <Label htmlFor="sentence_start_date">Sentence Start Date</Label>
              <Input id="sentence_start_date" type="date" value={form.sentence_start_date} onChange={(e) => set("sentence_start_date", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="sentence_end_date">Sentence End Date</Label>
              <Input id="sentence_end_date" type="date" value={form.sentence_end_date} onChange={(e) => set("sentence_end_date", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="date_in">Date In (Custody)</Label>
              <Input id="date_in" type="date" value={form.date_in} onChange={(e) => set("date_in", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="date_out">Date Out (Released)</Label>
              <Input id="date_out" type="date" value={form.date_out} onChange={(e) => set("date_out", e.target.value)} />
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Court Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="court_date">Court Date</Label>
              <Input id="court_date" type="date" value={form.court_date} onChange={(e) => set("court_date", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="presiding_judge">Presiding Judge</Label>
              <Input id="presiding_judge" value={form.presiding_judge} onChange={(e) => set("presiding_judge", e.target.value)} placeholder="Judge name" />
            </div>
          </div>
          <div>
            <Label htmlFor="court_ruling">Court Ruling Summary</Label>
            <Textarea id="court_ruling" value={form.court_ruling} onChange={(e) => set("court_ruling", e.target.value)} placeholder="Brief summary of the court's ruling..." rows={3} />
          </div>
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea id="notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any additional notes about this convict..." rows={2} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-red-600 hover:bg-red-700 text-white">
              {saving ? "Saving..." : "Add to Convict DB"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
