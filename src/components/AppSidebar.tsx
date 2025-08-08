"use client";

import { useState } from "react";
import {
  BarChart3,
  Calendar,
  FileText,
  Home,
  MessageSquare,
  Settings,
  Users,
  PanelLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useNavigation } from "@/hooks/useNavigation";
import { Loading } from "@/components/ui/loading";

const menuItems = [
  { title: "Overview", url: "/dashboard", icon: Home },
  { title: "Personnel", url: "/personnel", icon: Users },
  { title: "Cases", url: "/cases", icon: FileText },
  { title: "Duties", url: "/duties", icon: Calendar },
  { title: "Communication", url: "/communication", icon: MessageSquare },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { isNavigating } = useNavigation();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      className={`h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200 flex-shrink-0 ${
        isCollapsed ? "w-16" : "w-64 lg:w-72"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div
          className={`${
            isCollapsed ? "p-3" : "p-4 lg:p-6"
          } border-b border-sidebar-border flex-shrink-0`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-sidebar-primary rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
              <Image
                src="/police logo.png"
                alt="Police Logo"
                width={isCollapsed ? 24 : 32}
                height={isCollapsed ? 24 : 32}
                className="object-contain"
              />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h2 className="text-sm lg:text-base font-semibold text-sidebar-foreground truncate">
                  MADPC
                </h2>
                <p className="text-xs lg:text-sm text-sidebar-foreground/70 truncate">
                  Command Center
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-2 lg:py-4 overflow-y-auto">
          <nav className={`${isCollapsed ? "px-2" : "px-3"}`}>
            {menuItems.map((item) => {
              const isActive = pathname === item.url;
              return (
                <Link
                  key={item.title}
                  href={item.url}
                  className={`flex items-center ${
                    isCollapsed
                      ? "justify-center px-2 py-3"
                      : "gap-3 px-3 py-3 lg:py-4"
                  } text-sm lg:text-base font-medium transition-colors rounded-lg mb-1 ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "hover:bg-sidebar-accent/50"
                  } ${isNavigating ? "opacity-50 pointer-events-none" : ""}`}
                  title={isCollapsed ? item.title : undefined}
                >
                  <item.icon
                    className={`${
                      isCollapsed ? "w-5 h-5" : "w-5 h-5 lg:w-6 lg:h-6"
                    } flex-shrink-0`}
                  />
                  {!isCollapsed && (
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{item.title}</span>
                      {isNavigating && <Loading size="sm" />}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Toggle Button */}
        <div className="p-2 border-t border-sidebar-border flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="w-full h-8 lg:h-10 hover:bg-sidebar-accent"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <PanelLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
