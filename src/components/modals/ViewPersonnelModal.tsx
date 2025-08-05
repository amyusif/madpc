import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Eye,
  Mail,
  Phone,
  Calendar,
  Shield,
  MapPin,
  Users,
  Heart,
  Baby,
  AlertCircle,
} from "lucide-react";
import type { Personnel } from "@/integrations/supabase/client";

interface ViewPersonnelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personnel: Personnel | null;
}

export default function ViewPersonnelModal({
  open,
  onOpenChange,
  personnel,
}: ViewPersonnelModalProps) {
  if (!personnel) return null;

  // Generate initials from name
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "suspended":
        return "bg-red-100 text-red-800 border-red-200";
      case "retired":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            Personnel Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section with Avatar and Basic Info */}
          <div className="flex items-start gap-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
            <Avatar className="h-20 w-20">
              <AvatarImage src="" alt={`${personnel.first_name} ${personnel.last_name}`} />
              <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-lg">
                {getInitials(personnel.first_name, personnel.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {personnel.first_name} {personnel.last_name}
                </h2>
                <Badge
                  className={`${getStatusColor(personnel.status)} font-medium px-3 py-1`}
                  variant="outline"
                >
                  {personnel.status.charAt(0).toUpperCase() + personnel.status.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  <span>Badge: {personnel.badge_number}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Joined: {new Date(personnel.date_joined).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Professional Information
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Rank</p>
                    <p className="text-gray-900 capitalize font-semibold">{personnel.rank}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Unit</p>
                    <p className="text-gray-900 capitalize font-semibold">{personnel.unit}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-green-600" />
                Contact Information
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Mail className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <p className="text-gray-900 font-medium">{personnel.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <Phone className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Phone</p>
                    <p className="text-gray-900 font-medium">{personnel.phone || "Not provided"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                <Heart className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Marital Status</p>
                  <p className="text-gray-900 font-semibold">{personnel.marital_status}</p>
                </div>
              </div>
              
              {personnel.spouse && (
                <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
                  <Users className="w-5 h-5 text-pink-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Spouse</p>
                    <p className="text-gray-900 font-semibold">{personnel.spouse}</p>
                  </div>
                </div>
              )}
              
              {personnel.children_count !== null && personnel.children_count !== undefined && (
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <Baby className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Children</p>
                    <p className="text-gray-900 font-semibold">
                      {personnel.no_children ? "No children" : `${personnel.children_count} child${personnel.children_count !== 1 ? 'ren' : ''}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Emergency Contacts */}
          {personnel.emergency_contacts && personnel.emergency_contacts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Emergency Contacts
              </h3>
              
              <div className="space-y-2">
                {personnel.emergency_contacts.map((contact, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                    <Phone className="w-4 h-4 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Contact {index + 1}</p>
                      <p className="text-gray-900 font-medium">{contact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Created:</span>{" "}
                {new Date(personnel.created_at).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span>{" "}
                {new Date(personnel.updated_at).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
