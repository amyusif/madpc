import { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileSidebar } from "./MobileSidebar";
import { UserProfilePhotoUpload } from "./UserProfilePhotoUpload";
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
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleRefreshClick = () => {
    refreshAll();
  };

  return (
    <div className="h-screen w-full flex overflow-hidden">
      {/* Sidebar - Hidden on mobile, shown on desktop */}
      <div className="hidden md:flex flex-shrink-0">
        <AppSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Top Header */}
        <header className="h-14 flex items-center justify-between px-3 sm:px-4 lg:px-6 border-b bg-background flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setShowMobileSidebar(true)}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </Button>

            {/* App title on mobile */}
            <div className="md:hidden">
              <h1 className="text-lg font-semibold">MADPC</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
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
                  <UserProfilePhotoUpload
                    currentPhotoUrl={profile?.avatar_url}
                    size="sm"
                    editable={false}
                    showChangeButton={false}
                  />
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
        <main className="flex-1 bg-muted/20 overflow-auto p-3 sm:p-4 lg:p-6">
          <div className="h-full w-full max-w-full">{children}</div>
        </main>
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={showMobileSidebar}
        onClose={() => setShowMobileSidebar(false)}
      />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
      />
    </div>
  );
}
