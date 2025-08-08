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
  X,
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

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const { isNavigating } = useNavigation();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border z-50 md:hidden transform transition-transform duration-200">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center overflow-hidden">
                <Image
                  src="/police logo.png"
                  alt="Police Logo"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <div>
                <h2 className="text-base font-semibold text-sidebar-foreground">
                  MADPC
                </h2>
                <p className="text-sm text-sidebar-foreground/70">
                  Command Center
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex-1 py-4 overflow-y-auto">
            <nav className="px-3">
              {menuItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <Link
                    key={item.title}
                    href={item.url}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-3 text-base font-medium transition-colors rounded-lg mb-1 ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "hover:bg-sidebar-accent/50"
                    } ${isNavigating ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex items-center gap-2">
                      {item.title}
                      {isNavigating && <Loading size="sm" />}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
