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
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

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

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      className={`h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200 ${
        isCollapsed ? "w-16" : "w-72"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-sidebar-primary rounded-full flex items-center justify-center overflow-hidden">
              <img
                src="/police logo.png"
                alt="Police Logo"
                className="w-8 h-8 object-contain"
              />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-base font-semibold text-sidebar-foreground">
                  MADPC
                </h2>
                <p className="text-sm text-sidebar-foreground/70">
                  Command Center
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4">
          <nav className="px-3">
            {menuItems.map((item) => {
              const isActive = pathname === item.url;
              return (
                <Link
                  key={item.title}
                  href={item.url}
                  className={`flex items-center gap-4 px-3 py-4 text-lg font-semibold transition-colors rounded-lg mb-1 ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "hover:bg-sidebar-accent/50"
                  }`}
                >
                  <item.icon className="w-6 h-6 flex-shrink-0" />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Toggle Button */}
        <div className="p-2 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="w-full h-8"
          >
            <PanelLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
