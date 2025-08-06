import { useRefresh } from "@/hooks/useRefresh";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RefreshIndicatorProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "outline" | "default";
  showText?: boolean;
  refreshType?: "all" | "personnel" | "cases" | "duties";
}

export function RefreshIndicator({ 
  className, 
  size = "md", 
  variant = "ghost", 
  showText = false,
  refreshType = "all"
}: RefreshIndicatorProps) {
  const { isRefreshing, refreshAll, refreshPersonnel, refreshCases, refreshDuties } = useRefresh();

  const handleRefresh = () => {
    switch (refreshType) {
      case "personnel":
        refreshPersonnel();
        break;
      case "cases":
        refreshCases();
        break;
      case "duties":
        refreshDuties();
        break;
      default:
        refreshAll();
        break;
    }
  };

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4", 
    lg: "w-5 h-5"
  };

  return (
    <Button
      variant={variant}
      size={size === "sm" ? "sm" : size === "lg" ? "lg" : "default"}
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={cn(
        "relative",
        !showText && sizeClasses[size],
        className
      )}
    >
      <RefreshCw 
        className={cn(
          iconSizes[size],
          isRefreshing && "animate-spin",
          showText && "mr-2"
        )} 
      />
      {showText && (
        <span className="text-sm">
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </span>
      )}
    </Button>
  );
}

// Quick refresh button for specific data types
export function PersonnelRefreshButton({ className }: { className?: string }) {
  return (
    <RefreshIndicator 
      refreshType="personnel" 
      size="sm" 
      variant="outline"
      className={className}
    />
  );
}

export function CasesRefreshButton({ className }: { className?: string }) {
  return (
    <RefreshIndicator 
      refreshType="cases" 
      size="sm" 
      variant="outline"
      className={className}
    />
  );
}

export function DutiesRefreshButton({ className }: { className?: string }) {
  return (
    <RefreshIndicator 
      refreshType="duties" 
      size="sm" 
      variant="outline"
      className={className}
    />
  );
}
