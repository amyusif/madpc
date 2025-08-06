import { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { RefreshCw, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useRefresh } from "@/hooks/useRefresh";
import { LogoutConfirmModal } from "./modals/LogoutConfirmModal";
import { NotificationDropdown } from "./NotificationDropdown";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { profile } = useAuth();
  const { refreshAll, isRefreshing } = useRefresh();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleRefreshClick = () => {
    refreshAll();
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Sidebar */}
      <div className="flex-shrink-0">
        <AppSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 flex items-center justify-between px-4 border-b bg-background">
          <div className="flex items-center gap-4">
            {/* Sidebar toggle is now handled within the sidebar itself */}
          </div>

          <div className="flex items-center gap-4">
            <NotificationDropdown />

            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="relative"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                      {profile?.full_name
                        ? profile.full_name.charAt(0).toUpperCase()
                        : "O"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.full_name || "Officer"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {profile?.role === "district_commander"
                        ? "District Commander"
                        : "Unit Supervisor"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogoutClick}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 bg-muted/20">{children}</main>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
      />
    </div>
  );
}
