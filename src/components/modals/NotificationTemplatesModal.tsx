import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, FileText } from "lucide-react";

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: "alert" | "announcement" | "reminder" | "custom";
}

const defaultTemplates: Template[] = [
  {
    id: "1",
    name: "Emergency Alert",
    subject: "🚨 URGENT: Emergency Alert",
    body: "This is an emergency alert. All personnel must report to their designated stations immediately.\n\nDetails: [DETAILS]\n\nTime: [TIME]\nLocation: [LOCATION]",
    category: "alert"
  },
  {
    id: "2", 
    name: "Shift Reminder",
    subject: "Shift Reminder - [DATE]",
    body: "This is a reminder about your upcoming shift:\n\nDate: [DATE]\nTime: [TIME]\nLocation: [LOCATION]\nDuty: [DUTY]\n\nPlease report on time and in proper uniform.",
    category: "reminder"
  },
  {
    id: "3",
    name: "General Announcement", 
    subject: "MADPC Announcement",
    body: "Dear Personnel,\n\n[ANNOUNCEMENT]\n\nThank you for your attention.\n\nMADPC Administration",
    category: "announcement"
  }
];

interface NotificationTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate?: (template: Template) => void;
}

export default function NotificationTemplatesModal({ 
  open, 
  onOpenChange, 
  onSelectTemplate 
}: NotificationTemplatesModalProps) {
  const [templates, setTemplates] = useState<Template[]>(defaultTemplates);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
    category: "custom" as Template["category"]
  });

  const handleSaveTemplate = () => {
    if (!formData.name.trim() || !formData.subject.trim() || !formData.body.trim()) return;

    const template: Template = {
      id: editingTemplate?.id || Date.now().toString(),
      name: formData.name,
      subject: formData.subject,
      body: formData.body,
      category: formData.category
    };

    if (editingTemplate) {
      setTemplates(templates.map(t => t.id === editingTemplate.id ? template : t));
    } else {
      setTemplates([...templates, template]);
    }

    resetForm();
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      category: template.category
    });
    setShowForm(true);
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
  };

  const resetForm = () => {
    setFormData({ name: "", subject: "", body: "", category: "custom" });
    setEditingTemplate(null);
    setShowForm(false);
  };

  const getCategoryColor = (category: Template["category"]) => {
    switch (category) {
      case "alert": return "bg-red-100 text-red-800";
      case "announcement": return "bg-blue-100 text-blue-800";
      case "reminder": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Notification Templates
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!showForm ? (
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Select a template to use or create a new one
                </p>
                <Button onClick={() => setShowForm(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Template
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTemplate(template);
                            }}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          {template.category === "custom" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTemplate(template.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <Badge className={getCategoryColor(template.category)}>
                        {template.category}
                      </Badge>
                    </CardHeader>
                    <CardContent 
                      className="pt-0"
                      onClick={() => onSelectTemplate?.(template)}
                    >
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Subject:</p>
                          <p className="text-sm font-medium line-clamp-1">{template.subject}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Body:</p>
                          <p className="text-sm line-clamp-3">{template.body}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">
                  {editingTemplate ? "Edit Template" : "Create New Template"}
                </h3>
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Emergency Alert"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as Template["category"] })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="custom">Custom</option>
                    <option value="alert">Alert</option>
                    <option value="announcement">Announcement</option>
                    <option value="reminder">Reminder</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Message subject"
                />
              </div>

              <div className="space-y-2">
                <Label>Message Body</Label>
                <Textarea
                  rows={8}
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Message content... Use [PLACEHOLDERS] for dynamic content"
                />
                <p className="text-xs text-muted-foreground">
                  Available placeholders: [DATE], [TIME], [LOCATION], [DETAILS], [DUTY], [NAME]
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTemplate}>
                  {editingTemplate ? "Update" : "Create"} Template
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
