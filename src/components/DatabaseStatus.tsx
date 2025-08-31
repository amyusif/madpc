"use client";

import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

export function DatabaseStatus() {
  return (
    <Badge 
      variant="default" 
      className="text-xs cursor-help"
      title="Currently using: Firebase Firestore"
    >
      <Zap className="w-3 h-3 mr-1" />
      Firebase
    </Badge>
  );
}
