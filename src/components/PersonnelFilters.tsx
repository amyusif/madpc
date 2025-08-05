import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Filter,
  X,
  Calendar,
  Users,
  Shield,
  MapPin,
  RotateCcw,
} from "lucide-react";

export interface PersonnelFilters {
  status: string[];
  rank: string[];
  unit: string[];
  dateJoinedFrom: string;
  dateJoinedTo: string;
  maritalStatus: string[];
}

interface PersonnelFiltersProps {
  filters: PersonnelFilters;
  onFiltersChange: (filters: PersonnelFilters) => void;
  activeFilterCount: number;
}

const statusOptions = [
  { value: "active", label: "Active", color: "bg-green-100 text-green-800" },
  { value: "inactive", label: "Inactive", color: "bg-gray-100 text-gray-800" },
  { value: "suspended", label: "Suspended", color: "bg-red-100 text-red-800" },
  { value: "retired", label: "Retired", color: "bg-blue-100 text-blue-800" },
];

const rankOptions = [
  "constable",
  "corporal", 
  "sergeant",
  "inspector",
  "chief inspector",
  "superintendent",
  "chief superintendent",
  "assistant commissioner",
  "deputy commissioner",
  "commissioner",
];

const unitOptions = [
  "patrol",
  "investigation",
  "traffic",
  "cybercrime",
  "administration",
  "training",
  "special operations",
];

const maritalStatusOptions = [
  "Single",
  "Married",
  "Divorced",
];

export default function PersonnelFilters({
  filters,
  onFiltersChange,
  activeFilterCount,
}: PersonnelFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof PersonnelFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const toggleArrayFilter = (key: keyof PersonnelFilters, value: string) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    updateFilter(key, newArray);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      status: [],
      rank: [],
      unit: [],
      dateJoinedFrom: "",
      dateJoinedTo: "",
      maritalStatus: [],
    });
  };

  const clearFilter = (key: keyof PersonnelFilters) => {
    if (Array.isArray(filters[key])) {
      updateFilter(key, []);
    } else {
      updateFilter(key, "");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="start">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filter Personnel
                </CardTitle>
                <div className="flex items-center gap-2">
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-xs"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Clear All
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Status
                  </Label>
                  {filters.status.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearFilter("status")}
                      className="text-xs h-6 px-2"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((option) => (
                    <Badge
                      key={option.value}
                      variant={filters.status.includes(option.value) ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${
                        filters.status.includes(option.value) 
                          ? "bg-blue-600 text-white" 
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => toggleArrayFilter("status", option.value)}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Rank Filter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Rank
                  </Label>
                  {filters.rank.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearFilter("rank")}
                      className="text-xs h-6 px-2"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {rankOptions.map((rank) => (
                    <Badge
                      key={rank}
                      variant={filters.rank.includes(rank) ? "default" : "outline"}
                      className={`cursor-pointer transition-colors capitalize ${
                        filters.rank.includes(rank) 
                          ? "bg-blue-600 text-white" 
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => toggleArrayFilter("rank", rank)}
                    >
                      {rank}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Unit Filter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Unit
                  </Label>
                  {filters.unit.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearFilter("unit")}
                      className="text-xs h-6 px-2"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {unitOptions.map((unit) => (
                    <Badge
                      key={unit}
                      variant={filters.unit.includes(unit) ? "default" : "outline"}
                      className={`cursor-pointer transition-colors capitalize ${
                        filters.unit.includes(unit) 
                          ? "bg-blue-600 text-white" 
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => toggleArrayFilter("unit", unit)}
                    >
                      {unit}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Marital Status Filter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Marital Status</Label>
                  {filters.maritalStatus.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearFilter("maritalStatus")}
                      className="text-xs h-6 px-2"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {maritalStatusOptions.map((status) => (
                    <Badge
                      key={status}
                      variant={filters.maritalStatus.includes(status) ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${
                        filters.maritalStatus.includes(status) 
                          ? "bg-blue-600 text-white" 
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => toggleArrayFilter("maritalStatus", status)}
                    >
                      {status}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date Joined Range
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-500">From</Label>
                    <Input
                      type="date"
                      value={filters.dateJoinedFrom}
                      onChange={(e) => updateFilter("dateJoinedFrom", e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">To</Label>
                    <Input
                      type="date"
                      value={filters.dateJoinedTo}
                      onChange={(e) => updateFilter("dateJoinedTo", e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
                {(filters.dateJoinedFrom || filters.dateJoinedTo) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      updateFilter("dateJoinedFrom", "");
                      updateFilter("dateJoinedTo", "");
                    }}
                    className="text-xs h-6 px-2 w-full"
                  >
                    Clear Date Range
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {filters.status.map((status) => (
            <Badge
              key={`status-${status}`}
              variant="secondary"
              className="text-xs gap-1"
            >
              Status: {status}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => toggleArrayFilter("status", status)}
              />
            </Badge>
          ))}
          {filters.rank.map((rank) => (
            <Badge
              key={`rank-${rank}`}
              variant="secondary"
              className="text-xs gap-1 capitalize"
            >
              Rank: {rank}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => toggleArrayFilter("rank", rank)}
              />
            </Badge>
          ))}
          {filters.unit.map((unit) => (
            <Badge
              key={`unit-${unit}`}
              variant="secondary"
              className="text-xs gap-1 capitalize"
            >
              Unit: {unit}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => toggleArrayFilter("unit", unit)}
              />
            </Badge>
          ))}
          {filters.maritalStatus.map((status) => (
            <Badge
              key={`marital-${status}`}
              variant="secondary"
              className="text-xs gap-1"
            >
              Marital: {status}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => toggleArrayFilter("maritalStatus", status)}
              />
            </Badge>
          ))}
          {(filters.dateJoinedFrom || filters.dateJoinedTo) && (
            <Badge variant="secondary" className="text-xs gap-1">
              Date: {filters.dateJoinedFrom || "Start"} - {filters.dateJoinedTo || "End"}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => {
                  updateFilter("dateJoinedFrom", "");
                  updateFilter("dateJoinedTo", "");
                }}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
