"use client";

import { useState, useEffect } from "react";
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
import { db, Convict } from "@/integrations/database";
import { useToast } from "@/hooks/use-toast";
import { Edit, Upload, X } from "lucide-react";

interface EditConvictModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  convict: Convict | null;
  onConvictUpdated: () => Promise<void>;
}

export default function EditConvictModal({
  open,
  onOpenChange,
  convict,
  onConvictUpdated,
}: EditConvictModalProps) {
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
    case_number: "",
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

  useEffect(() => {
    if (convict) {
      setForm({
        full_name: convict.full_name,
        alias: convict.alias || "",
        gender: convict.gender || "",
        date_of_birth: convict.date_of_birth || "",
        nationality: convict.nationality || "",
        photo_url: convict.photo_url || "",
        case_number: convict.case_number || "",
        crime_type: convict.crime_type,
        sentence: convict.sentence,
        sentence_start_date: convict.sentence_start_date || "",
        sentence_end_date: convict.sentence_end_date || "",
        date_in: convict.date_in || "",
        date_out: convict.date_out || "",
        status: convict.status,
        court_ruling: convict.court_ruling || "",
        court_date: convict.court_date || "",
        presiding_judge: convict.presiding_judge || "",
        notes: convict.notes || "",
      });
      setPhotoPreview(convict.photo_url || null);
    }
  }, [convict]);

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
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convict) return;

    setSaving(true);
    try {
      await db.updateConvict(convict.id, {
        full_name: form.full_name,
        alias: form.alias || null,
        gender: form.gender || null,
        date_of_birth: form.date_of_birth || null,
        nationality: form.nationality || null,
        photo_url: form.photo_url || null,
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

      toast({ title: "✅ Convict Updated", description: `${form.full_name}'s record has been updated.` });
      await onConvictUpdated();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Edit className="w-5 h-5 text-blue-600" />
            Edit Convict Record
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
                <Input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                <span className="text-xs text-blue-600 hover:underline">{uploadingPhoto ? "Uploading..." : "Change Photo"}</span>
              </label>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Full Name *</Label>
                <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required />
              </div>
              <div>
                <Label>Alias</Label>
                <Input value={form.alias} onChange={(e) => set("alias", e.target.value)} />
              </div>
              <div>
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><Label>Date of Birth</Label><Input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} /></div>
            <div><Label>Nationality</Label><Input value={form.nationality} onChange={(e) => set("nationality", e.target.value)} /></div>
          </div>

          <hr className="border-gray-200" />

          <div className="grid grid-cols-2 gap-4">
            <div><Label>Linked Case Number</Label><Input value={form.case_number} onChange={(e) => set("case_number", e.target.value)} /></div>
            <div>
              <Label>Convict Status</Label>
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

          <div className="grid grid-cols-2 gap-4">
            <div><Label>Crime Type *</Label><Input value={form.crime_type} onChange={(e) => set("crime_type", e.target.value)} required /></div>
            <div><Label>Sentence *</Label><Input value={form.sentence} onChange={(e) => set("sentence", e.target.value)} required /></div>
            <div><Label>Sentence Start</Label><Input type="date" value={form.sentence_start_date} onChange={(e) => set("sentence_start_date", e.target.value)} /></div>
            <div><Label>Sentence End</Label><Input type="date" value={form.sentence_end_date} onChange={(e) => set("sentence_end_date", e.target.value)} /></div>
            <div><Label>Date In (Custody)</Label><Input type="date" value={form.date_in} onChange={(e) => set("date_in", e.target.value)} /></div>
            <div><Label>Date Out (Released)</Label><Input type="date" value={form.date_out} onChange={(e) => set("date_out", e.target.value)} /></div>
          </div>

          <hr className="border-gray-200" />

          <div className="grid grid-cols-2 gap-4">
            <div><Label>Court Date</Label><Input type="date" value={form.court_date} onChange={(e) => set("court_date", e.target.value)} /></div>
            <div><Label>Presiding Judge</Label><Input value={form.presiding_judge} onChange={(e) => set("presiding_judge", e.target.value)} /></div>
          </div>
          <div><Label>Court Ruling</Label><Textarea value={form.court_ruling} onChange={(e) => set("court_ruling", e.target.value)} rows={3} /></div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} /></div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
